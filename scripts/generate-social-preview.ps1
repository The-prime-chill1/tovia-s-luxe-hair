Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "public\tovias-mega-sale.jpeg"
$outputPath = Join-Path $projectRoot "public\tovias-social-preview-v3.png"

function New-RoundedRectanglePath {
  param(
    [System.Drawing.RectangleF]$Rectangle,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($Rectangle.X, $Rectangle.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rectangle.X, $Rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

$canvas = New-Object System.Drawing.Bitmap 1200, 630
$canvas.SetResolution(96, 96)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 0, 0),
  (New-Object System.Drawing.Point 1200, 630),
  ([System.Drawing.ColorTranslator]::FromHtml("#18050e")),
  ([System.Drawing.ColorTranslator]::FromHtml("#8d124d"))
)
$graphics.FillRectangle($background, 0, 0, 1200, 630)

$source = [System.Drawing.Image]::FromFile($sourcePath)
$destination = New-Object System.Drawing.Rectangle 500, 0, 700, 630
$crop = New-Object System.Drawing.Rectangle 0, 0, 385, 347
$graphics.DrawImage($source, $destination, $crop, [System.Drawing.GraphicsUnit]::Pixel)

$photoTint = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 122, 11, 67))
$graphics.FillRectangle($photoTint, 500, 0, 700, 630)

$fade = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 330, 0),
  (New-Object System.Drawing.Point 1200, 0),
  ([System.Drawing.Color]::FromArgb(255, 43, 7, 25)),
  ([System.Drawing.Color]::FromArgb(0, 43, 7, 25))
)
$graphics.FillRectangle($fade, 330, 0, 870, 630)

$pink = [System.Drawing.ColorTranslator]::FromHtml("#f72784")
$gold = [System.Drawing.ColorTranslator]::FromHtml("#f7c768")
$white = [System.Drawing.Color]::White
$softWhite = [System.Drawing.ColorTranslator]::FromHtml("#f8dce9")
$mutedPink = [System.Drawing.ColorTranslator]::FromHtml("#f3bfd6")

$graphics.FillEllipse((New-Object System.Drawing.SolidBrush $pink), 65, 55, 96, 96)
$markFont = New-Object System.Drawing.Font "Georgia", 44, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$markFormat = New-Object System.Drawing.StringFormat
$markFormat.Alignment = [System.Drawing.StringAlignment]::Center
$markFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("T", $markFont, (New-Object System.Drawing.SolidBrush $white), (New-Object System.Drawing.RectangleF 65, 55, 96, 96), $markFormat)

$brandFont = New-Object System.Drawing.Font "Arial", 29, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$brandSmallFont = New-Object System.Drawing.Font "Arial", 15, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("TOVIA'S", $brandFont, (New-Object System.Drawing.SolidBrush $white), 184, 65)
$graphics.DrawString("L U X E   H A I R S", $brandSmallFont, (New-Object System.Drawing.SolidBrush $gold), 184, 105)

$pillRectangle = New-Object System.Drawing.RectangleF 64, 173, 366, 38
$pillPath = New-RoundedRectanglePath -Rectangle $pillRectangle -Radius 19
$graphics.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(28, 255, 255, 255))), $pillPath)
$graphics.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 255, 119, 182), 1)), $pillPath)
$pillFont = New-Object System.Drawing.Font "Arial", 13, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$pillFormat = New-Object System.Drawing.StringFormat
$pillFormat.Alignment = [System.Drawing.StringAlignment]::Center
$pillFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("PREMIUM RAW & VIRGIN HUMAN HAIR", $pillFont, (New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#ffd5e8"))), $pillRectangle, $pillFormat)

$headlineFont = New-Object System.Drawing.Font "Georgia", 64, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$headlineItalicFont = New-Object System.Drawing.Font "Georgia", 64, ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic), ([System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("Luxury in", $headlineFont, (New-Object System.Drawing.SolidBrush $white), 58, 238)
$headlineBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 64, 310),
  (New-Object System.Drawing.Point 430, 370),
  ([System.Drawing.ColorTranslator]::FromHtml("#ff2d8f")),
  $gold
)
$graphics.DrawString("every strand.", $headlineItalicFont, $headlineBrush, 58, 306)

$bodyFont = New-Object System.Drawing.Font "Arial", 21, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("Statement hair for women who make", $bodyFont, (New-Object System.Drawing.SolidBrush $softWhite), 68, 400)
$graphics.DrawString("every entrance count.", $bodyFont, (New-Object System.Drawing.SolidBrush $softWhite), 68, 432)

$buttonRectangle = New-Object System.Drawing.RectangleF 64, 490, 252, 58
$buttonPath = New-RoundedRectanglePath -Rectangle $buttonRectangle -Radius 29
$graphics.FillPath((New-Object System.Drawing.SolidBrush $pink), $buttonPath)
$buttonFont = New-Object System.Drawing.Font "Arial", 15, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$buttonFormat = New-Object System.Drawing.StringFormat
$buttonFormat.Alignment = [System.Drawing.StringAlignment]::Center
$buttonFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("SHOP THE COLLECTION", $buttonFont, (New-Object System.Drawing.SolidBrush $white), $buttonRectangle, $buttonFormat)

$domainFont = New-Object System.Drawing.Font "Arial", 16, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$graphics.DrawString("tovia-s-luxe-hair.vercel.app", $domainFont, (New-Object System.Drawing.SolidBrush $mutedPink), 64, 582)

$accent = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 0, 620),
  (New-Object System.Drawing.Point 1200, 620),
  ([System.Drawing.ColorTranslator]::FromHtml("#ff2d8f")),
  $gold
)
$graphics.FillRectangle($accent, 0, 620, 1200, 10)

$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$accent.Dispose()
$domainFont.Dispose()
$buttonFormat.Dispose()
$buttonFont.Dispose()
$buttonPath.Dispose()
$bodyFont.Dispose()
$headlineBrush.Dispose()
$headlineItalicFont.Dispose()
$headlineFont.Dispose()
$pillFormat.Dispose()
$pillFont.Dispose()
$pillPath.Dispose()
$brandSmallFont.Dispose()
$brandFont.Dispose()
$markFormat.Dispose()
$markFont.Dispose()
$fade.Dispose()
$photoTint.Dispose()
$source.Dispose()
$background.Dispose()
$graphics.Dispose()
$canvas.Dispose()

Write-Output $outputPath
