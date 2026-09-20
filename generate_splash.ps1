Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\gnz\Downloads\UZX WALLET.png'
$resDir = 'C:\Users\gnz\Downloads\zux0.0\public'
New-Item -ItemType Directory -Path $resDir -Force | Out-Null

# Generate splash 1080x1920 with dark red background and centered UZX logo
$splashBg = New-Object System.Drawing.Bitmap(1080, 1920)
$splashGraphics = [System.Drawing.Graphics]::FromImage($splashBg)
$darkRed = [System.Drawing.Color]::FromArgb(139, 30, 45)
$splashGraphics.Clear($darkRed)

$logoImg = [System.Drawing.Image]::FromFile($src)
$logoSize = 400
$logoBmp = New-Object System.Drawing.Bitmap($logoSize, $logoSize)
$gLogo = [System.Drawing.Graphics]::FromImage($logoBmp)
$gLogo.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gLogo.DrawImage($logoImg, 0, 0, $logoSize, $logoSize)

$x = [int]((1080 - $logoSize) / 2)
$y = [int]((1920 - $logoSize) / 2)
$splashGraphics.DrawImage($logoBmp, $x, $y, $logoSize, $logoSize)

$splashBg.Save("$resDir\splash.png", [System.Drawing.Imaging.ImageFormat]::Png)

$splashGraphics.Dispose()
$gLogo.Dispose()
$splashBg.Dispose()
$logoBmp.Dispose()
$logoImg.Dispose()

Write-Host "Created splash.png (1080x1920)"

# Generate adaptive icon foreground 432x432
$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap(432, 432)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 432, 432)
$bmp.Save("$resDir\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Created ic_launcher_foreground.png (432x432)"

# Create adaptive icon background solid dark red 432x432
$bg = New-Object System.Drawing.Bitmap(432, 432)
$bgG = [System.Drawing.Graphics]::FromImage($bg)
$bgG.Clear($darkRed)
$bg.Save("$resDir\ic_launcher_background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bgG.Dispose()
$bg.Dispose()
Write-Host "Created ic_launcher_background.png (432x432)"

Write-Host "All splash and adaptive icon files generated!"
