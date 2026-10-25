Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\satyam pathak\.gemini\antigravity-ide\brain\c8f1b218-3fb0-4375-b5ec-0ff6274fd504\.user_uploaded\media_1792948809222.jpg"
$baseDir = (Get-Item (Split-Path -Parent $PSScriptRoot)).FullName
$publicDir = Join-Path $baseDir "public"
$resDir = Join-Path $baseDir "android\app\src\main\res"

Write-Host "Base dir: $baseDir"
Write-Host "Public dir: $publicDir"
Write-Host "Res dir: $resDir"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source file not found at $srcPath"
    exit 1
}

# Read bytes into memory stream so file is never locked
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$srcImg = [System.Drawing.Bitmap]::FromStream($ms)

Write-Host "Source Image loaded: Width=$($srcImg.Width), Height=$($srcImg.Height)"

# 1. High-res copies to public
$logoPng = Join-Path $publicDir "logo.png"
$logoJpg = Join-Path $publicDir "logo.jpg"
$imagePng = Join-Path $publicDir "image.png"
$maharishiPng = Join-Path $publicDir "maharishi-logo.png"

[System.IO.File]::WriteAllBytes($logoJpg, $bytes)

# Save PNG copy
$bmpClone = New-Object System.Drawing.Bitmap($srcImg)
$bmpClone.Save($logoPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpClone.Save($imagePng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpClone.Save($maharishiPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpClone.Dispose()

Write-Host "Saved high-res web logos to $publicDir"

# Function to resize square icon
function Create-SquareIcon($src, $outPath, $size, $isTransparentBg, $paddingRatio) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($isTransparentBg) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $g.Clear([System.Drawing.Color]::White)
    }

    $pad = [int]($size * $paddingRatio)
    $availW = $size - (2 * $pad)
    $availH = $size - (2 * $pad)

    $scale = [Math]::Min($availW / $src.Width, $availH / $src.Height)
    $drawW = [int]($src.Width * $scale)
    $drawH = [int]($src.Height * $scale)
    $drawX = [int](($size - $drawW) / 2)
    $drawY = [int](($size - $drawH) / 2)

    $g.DrawImage($src, $drawX, $drawY, $drawW, $drawH)
    $g.Dispose()

    $parent = Split-Path -Parent $outPath
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outPath ($size x $size)"
}

# Function to create circular clipped icon
function Create-RoundIcon($src, $outPath, $size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)

    # Fill white inside circle
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.FillEllipse($brush, 0, 0, $size, $size)
    $brush.Dispose()

    $scale = [Math]::Min($size / $src.Width, $size / $src.Height)
    $drawW = [int]($src.Width * $scale)
    $drawH = [int]($src.Height * $scale)
    $drawX = [int](($size - $drawW) / 2)
    $drawY = [int](($size - $drawH) / 2)

    $g.DrawImage($src, $drawX, $drawY, $drawW, $drawH)
    $path.Dispose()
    $g.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated Round Icon: $outPath ($size x $size)"
}

# 2. Web favicons & PWA icons
Create-SquareIcon $srcImg (Join-Path $publicDir "favicon.png") 64 $false 0.02
Create-SquareIcon $srcImg (Join-Path $publicDir "favicon.ico") 48 $false 0.02
Create-SquareIcon $srcImg (Join-Path $publicDir "apple-touch-icon.png") 180 $false 0.04
Create-SquareIcon $srcImg (Join-Path $publicDir "android-chrome-192x192.png") 192 $false 0.04
Create-SquareIcon $srcImg (Join-Path $publicDir "android-chrome-512x512.png") 512 $false 0.04

# 3. Android Mipmap icons
$densities = @(
    @{ name = "mipmap-mdpi"; launcher = 48; foreground = 108 },
    @{ name = "mipmap-hdpi"; launcher = 72; foreground = 162 },
    @{ name = "mipmap-xhdpi"; launcher = 96; foreground = 216 },
    @{ name = "mipmap-xxhdpi"; launcher = 144; foreground = 324 },
    @{ name = "mipmap-xxxhdpi"; launcher = 192; foreground = 432 }
)

foreach ($d in $densities) {
    $dirPath = Join-Path $resDir $d.name
    if (Test-Path $dirPath) {
        # Standard launcher (square/white padded)
        Create-SquareIcon $srcImg (Join-Path $dirPath "ic_launcher.png") $d.launcher $false 0.04
        # Round launcher
        Create-RoundIcon $srcImg (Join-Path $dirPath "ic_launcher_round.png") $d.launcher
        # Adaptive foreground (transparent bg, centered in safe zone ~70%)
        Create-SquareIcon $srcImg (Join-Path $dirPath "ic_launcher_foreground.png") $d.foreground $true 0.16
    }
}

$srcImg.Dispose()
$ms.Dispose()

Write-Host "=== All App & Web Icons Generated Successfully ==="
