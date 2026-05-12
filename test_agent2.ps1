<# 
    ==============================================================
             RIR STUDIO - Monitoring Agent v1.0                  
             Auto Hardware Collector & Heartbeat                 
    ==============================================================
    
    SETUP:
    1. Edit $ServerUrl dengan URL server monitoring Anda
    2. Jalankan script ini sebagai Administrator
    3. Untuk auto-run saat startup, gunakan Task Scheduler
    
    TASK SCHEDULER SETUP:
    1. Buka Task Scheduler → Create Basic Task
    2. Name: "RIR Monitoring Agent"
    3. Trigger: When the computer starts
    4. Action: Start a program
       - Program: powershell.exe
       - Arguments: -ExecutionPolicy Bypass -File "C:\path\to\monitoring-agent.ps1"
    5. Ulangi setiap 5 menit (di Properties → Triggers → Edit → Repeat task)
#>

# ═══════════════════════════════════════════════════════════════
#  KONFIGURASI - Sesuaikan dengan environment Anda
# ═══════════════════════════════════════════════════════════════

$ServerUrl     = "http://localhost:8000"   # URL server Monitoring Inventaris
$ApiEndpoint   = "/api/agent/heartbeat"
$IntervalSec   = 300                       # Interval heartbeat (detik) = 5 menit
$AgentVersion  = "1.0.0"
$LogFile       = "$PSScriptRoot\agent-log.txt"
$MaxLogSizeMB  = 5

# ═══════════════════════════════════════════════════════════════
#  FUNCTIONS
# ═══════════════════════════════════════════════════════════════

function Write-AgentLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Console output
    switch ($Level) {
        "ERROR"   { Write-Host $logEntry -ForegroundColor Red }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default   { Write-Host $logEntry -ForegroundColor Cyan }
    }
    
    # File output
    try {
        Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
        
        # Rotate log if too large
        if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length / 1MB) -gt $MaxLogSizeMB) {
            $backupLog = "$LogFile.bak"
            if (Test-Path $backupLog) { Remove-Item $backupLog -Force }
            Rename-Item -Path $LogFile -NewName $backupLog -Force
        }
    } catch { }
}

function Get-SystemInfo {
    Write-AgentLog "Mengumpulkan informasi sistem..."
    
    $info = @{}
    
    # Hostname
    $info.hostname = $env:COMPUTERNAME
    
    # IP Address (ambil IP non-loopback pertama)
    try {
        $ipConfig = Get-NetIPAddress -AddressFamily IPv4 |
            Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" } |
            Select-Object -First 1
        $info.ip_address = $ipConfig.IPAddress
    } catch {
        # Fallback method
        $info.ip_address = (Test-Connection -ComputerName $env:COMPUTERNAME -Count 1).IPV4Address.IPAddressToString
    }
    
    # Serial Number
    try {
        $bios = Get-WmiObject -Class Win32_BIOS -ErrorAction SilentlyContinue
        $info.serial_number = $bios.SerialNumber
        if ($info.serial_number -eq "To Be Filled By O.E.M." -or [string]::IsNullOrWhiteSpace($info.serial_number)) {
            $info.serial_number = $null
        }
    } catch {
        $info.serial_number = $null
    }
    
    # Operating System
    try {
        $os = Get-WmiObject -Class Win32_OperatingSystem -ErrorAction SilentlyContinue
        $info.os = "$($os.Caption) $($os.Version) (Build $($os.BuildNumber))"
    } catch {
        $info.os = [System.Environment]::OSVersion.VersionString
    }
    
    # CPU
    try {
        $cpu = Get-WmiObject -Class Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
        $info.cpu = "$($cpu.Name) ($($cpu.NumberOfCores) Cores)"
    } catch {
        $info.cpu = "Unknown"
    }
    
    # RAM
    try {
        $ram = Get-WmiObject -Class Win32_ComputerSystem -ErrorAction SilentlyContinue
        $totalRamGB = [math]::Round($ram.TotalPhysicalMemory / 1GB, 1)
        $info.ram_total = "${totalRamGB} GB"
        
        $freeRam = Get-WmiObject -Class Win32_OperatingSystem -ErrorAction SilentlyContinue
        $usedRamGB = [math]::Round(($ram.TotalPhysicalMemory - ($freeRam.FreePhysicalMemory * 1KB)) / 1GB, 1)
        $info.ram_used = "${usedRamGB} GB"
    } catch {
        $info.ram_total = "Unknown"
        $info.ram_used = "Unknown"
    }
    
    # Disk (C: drive)
    try {
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue
        $totalDiskGB = [math]::Round($disk.Size / 1GB, 1)
        $usedDiskGB = [math]::Round(($disk.Size - $disk.FreeSpace) / 1GB, 1)
        $info.disk_total = "${totalDiskGB} GB"
        $info.disk_used = "${usedDiskGB} GB"
    } catch {
        $info.disk_total = "Unknown"
        $info.disk_used = "Unknown"
    }
    
    # Uptime
    try {
        $uptime = (Get-Date) - (Get-WmiObject -Class Win32_OperatingSystem).ConvertToDateTime((Get-WmiObject -Class Win32_OperatingSystem).LastBootUpTime)
        $info.uptime = "$($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"
    } catch {
        $info.uptime = "Unknown"
    }
    
    # MAC Address
    try {
        $nic = Get-WmiObject -Class Win32_NetworkAdapterConfiguration |
            Where-Object { $_.IPEnabled -eq $true -and $_.MACAddress } |
            Select-Object -First 1
        $info.mac_address = $nic.MACAddress
    } catch {
        $info.mac_address = $null
    }
    
    # Currently logged in user
    $info.logged_in_user = "$env:USERDOMAIN\$env:USERNAME"
    
    # Agent version
    $info.agent_version = $AgentVersion
    
    Write-AgentLog "Data dikumpulkan: $($info.hostname) | IP: $($info.ip_address) | RAM: $($info.ram_total)" "SUCCESS"
    
    return $info
}

function Send-Heartbeat {
    param([hashtable]$SystemInfo)
    
    $url = "${ServerUrl}${ApiEndpoint}"
    Write-AgentLog "Mengirim heartbeat ke $url..."
    
    try {
        $json = $SystemInfo | ConvertTo-Json -Depth 3
        
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $json -ContentType "application/json" -TimeoutSec 30
        
        if ($response.status -eq "ok") {
            Write-AgentLog "[OK] Heartbeat diterima! Asset: $($response.name) ($($response.code))" "SUCCESS"
        } elseif ($response.status -eq "unregistered") {
            Write-AgentLog "[WARN] Device belum terdaftar di sistem. Silakan tambahkan asset di dashboard." "WARNING"
        } else {
            Write-AgentLog "Response: $($response | ConvertTo-Json -Compress)" "INFO"
        }
        
        return $response
    } catch {
        $errorMsg = $_.Exception.Message
        Write-AgentLog "[FAILED] Gagal mengirim heartbeat: $errorMsg" "ERROR"
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-AgentLog "HTTP Status: $statusCode" "ERROR"
        }
        
        return $null
    }
}

# ═══════════════════════════════════════════════════════════════
#  MAIN LOOP
# ═══════════════════════════════════════════════════════════════

Clear-Host
Write-Host ""
Write-Host "  ==============================================================" -ForegroundColor Magenta
Write-Host "           RIR STUDIO - Monitoring Agent v$AgentVersion               " -ForegroundColor Magenta
Write-Host "           Auto Hardware Collector & Heartbeat                 " -ForegroundColor Magenta
Write-Host "  ==============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Server  : $ServerUrl" -ForegroundColor Gray
Write-Host "  Interval: $IntervalSec detik" -ForegroundColor Gray
Write-Host "  Log     : $LogFile" -ForegroundColor Gray
Write-Host ""

Write-AgentLog "Agent dimulai pada $env:COMPUTERNAME"

# Run indefinitely
while ($true) {
    try {
        $systemInfo = Get-SystemInfo
        $result = Send-Heartbeat -SystemInfo $systemInfo
        
        Write-AgentLog "Menunggu $IntervalSec detik sebelum heartbeat berikutnya..."
        Start-Sleep -Seconds $IntervalSec
    } catch {
        $errorMsg = $_.Exception.Message
        Write-AgentLog "Error di main loop: $errorMsg" "ERROR"
        Start-Sleep -Seconds 30  # Wait shorter on error before retry
    }
}
