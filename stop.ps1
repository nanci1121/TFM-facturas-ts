$BackendPidFile = ".backend.pid"
$FrontendPidFile = ".frontend.pid"

# Function to kill process tree
function Stop-ProcessTree($PidFile) {
    if (Test-Path $PidFile) {
        $ProcessId = Get-Content $PidFile
        Write-Host "Stopping process with PID: $ProcessId from $PidFile..."
        try {
            # /T kills child processes (tree), /F force
            taskkill /PID $ProcessId /T /F
            Remove-Item $PidFile
            Write-Host "Stopped."
        }
        catch {
            Write-Host "Error stopping process: $_"
        }
    } else {
        Write-Host "PID file $PidFile not found."
    }
}

Stop-ProcessTree -PidFile $BackendPidFile
Stop-ProcessTree -PidFile $FrontendPidFile

Write-Host "Application stopped."
