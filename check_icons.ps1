Add-Type -AssemblyName System.Drawing

# Check source icon
$src = 'C:\Users\gnz\Downloads\UZX WALLET.png'
if (Test-Path $src) {
    $img = [System.Drawing.Image]::FromFile($src)
    Write-Host "SOURCE: UZX WALLET.png $($img.Width)x$($img.Height)"
    $img.Dispose()
}

# Check public icons
Get-ChildItem 'C:\Users\gnz\Downloads\zux0.0\public\*.png' | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    Write-Host "$($_.Name) $($img.Width)x$($img.Height) $($_.Length) bytes"
    $img.Dispose()
}

# Check Android res
$androidRes = 'C:\Users\gnz\Downloads\zux0.0\android\app\src\main\res'
if (Test-Path $androidRes) {
    Get-ChildItem $androidRes -Directory -Filter 'mipmap*' | ForEach-Object {
        $files = Get-ChildItem $_.FullName -File
        Write-Host "$($_.Name): $($files.Count) files"
        foreach ($f in $files) {
            Write-Host "  $($f.Name) $($f.Length) bytes"
        }
    }
} else {
    Write-Host "ANDROID RES NOT FOUND (android dir does not exist locally)"
}
