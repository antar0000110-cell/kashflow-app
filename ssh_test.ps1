$password = '9PgTJ2Hn8sz0'
$process = Start-Process ssh -ArgumentList 'root@153.75.246.35', 'echo Connected' -RedirectStandardInput $true -RedirectStandardOutput $true -RedirectStandardError $true -PassThru -NoNewWindow
$process.StandardInput.WriteLine($password)
$process.StandardInput.Close()
$output = $process.StandardOutput.ReadToEnd()
$error = $process.StandardError.ReadToEnd()
$process.WaitForExit()
Write-Host "Exit Code: $($process.ExitCode)"
Write-Host "Output: $output"
Write-Host "Error: $error"