$BackendDir = "backend"
$FrontendDir = "frontend"
$BackendLog = "..\backend.log"
$FrontendLog = "..\frontend.log"
$BackendPidFile = ".backend.pid"
$FrontendPidFile = ".frontend.pid"

Write-Host "Starting Backend..."
$BackendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory $BackendDir -PassThru -RedirectStandardOutput $BackendLog -RedirectStandardError $BackendLog -WindowStyle Hidden
$BackendProcess.Id | Out-File $BackendPidFile
Write-Host "Backend started (PID: $($BackendProcess.Id))"

Write-Host "Starting Frontend..."
$FrontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory $FrontendDir -PassThru -RedirectStandardOutput $FrontendLog -RedirectStandardError $FrontendLog -WindowStyle Hidden
$FrontendProcess.Id | Out-File $FrontendPidFile
Write-Host "Frontend started (PID: $($FrontendProcess.Id))"

Write-Host "Application started in background."
Write-Host "Logs are available in backend.log and frontend.log"
Write-Host "Run .\stop.ps1 to stop the application."
