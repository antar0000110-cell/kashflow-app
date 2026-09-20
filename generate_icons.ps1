Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\gnz\Downloads\UZX WALLET.png'
$publicDir = 'C:\Users\gnz\Downloads\zux0.0\public'

function Resize-Image($sourcePath, $outputPath, $width, $height) {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($img, 0, 0, $width, $height)
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Created: $outputPath ($width x $height)"
}

# Favicon - 32x32
Resize-Image $src "$publicDir\favicon.png" 32 32

# Apple touch icon - 180x180
Resize-Image $src "$publicDir\apple-touch-icon.png" 180 180

# Main icon - 512x512
Resize-Image $src "$publicDir\icon.png" 512 512

# Logo for in-app - 1024x1024
Resize-Image $src "$publicDir\uzx-logo.png" 1024 1024

# Small logo - 256x256
Resize-Image $src "$publicDir\logo.png" 256 256

# PWA icons
Resize-Image $src "$publicDir\icon-192.png" 192 192
Resize-Image $src "$publicDir\icon-512.png" 512 512

# Android mipmap icons - direct copy to public for reference
$androidSizes = @{
    'mdpi' = 48
    'hdpi' = 72
    'xhdpi' = 96
    'xxhdpi' = 144
    'xxxhdpi' = 192
}

foreach ($density in $androidSizes.Keys) {
    $size = $androidSizes[$density]
    $dir = "$publicDir\android-mipmap-$density"
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Resize-Image $src "$dir\ic_launcher.png" $size $size
    Resize-Image $src "$dir\ic_launcher_round.png" $size $size
}

# Create favicon.ico with multiple sizes
$icoImg = [System.Drawing.Image]::FromFile($src)
$bmp16 = New-Object System.Drawing.Bitmap(16, 16)
$bmp32 = New-Object System.Drawing.Bitmap(32, 32)
$bmp48 = New-Object System.Drawing.Bitmap(48, 48)

$g16 = [System.Drawing.Graphics]::FromImage($bmp16)
$g16.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g16.DrawImage($icoImg, 0, 0, 16, 16)

$g32 = [System.Drawing.Graphics]::FromImage($bmp32)
$g32.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g32.DrawImage($icoImg, 0, 0, 32, 32)

$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g48.DrawImage($icoImg, 0, 0, 48, 48)

$bmp16.Save("$publicDir\favicon-16.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp32.Save("$publicDir\favicon-32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp48.Save("$publicDir\favicon-48.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host ""
Write-Host "All icons generated successfully!"
Write-Host "Source: UZX WALLET.png (1254x1254)"
