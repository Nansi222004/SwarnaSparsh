param (
    [string]$srcFolder = "c:\Users\RCom\Desktop\sands-ornaments\sands-ornaments\frontend\src\modules\user\assets",
    [int]$maxDim = 1200
)

Add-Type -AssemblyName System.Drawing

function Compress-Image {
    param (
        [string]$filePath,
        [int]$maxDimension
    )

    try {
        # Load the image
        $img = [System.Drawing.Image]::FromFile($filePath)
        $width = $img.Width
        $height = $img.Height

        # Calculate new dimensions if it exceeds maxDimension
        $needsResize = $false
        if ($width -gt $maxDimension -or $height -gt $maxDimension) {
            $needsResize = $true
            if ($width -gt $height) {
                $newWidth = $maxDimension
                $newHeight = [int]($height * ($maxDimension / $width))
            } else {
                $newHeight = $maxDimension
                $newWidth = [int]($width * ($maxDimension / $height))
            }
        } else {
            $newWidth = $width
            $newHeight = $height
        }

        # If it's a huge file (e.g. over 500KB) or needs resize, we rewrite it
        $fileSize = (Get-Item $filePath).Length
        if ($needsResize -or $fileSize -gt 500KB) {
            Write-Host "Compressing: $filePath ($($width)x$($height), $([Math]::Round($fileSize/1MB, 2)) MB)"
            
            # Create bitmap of new dimensions
            $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
            $graph = [System.Drawing.Graphics]::FromImage($bmp)
            
            # High quality scaling
            $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            
            $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
            
            # Dispose original so we can overwrite it
            $img.Dispose()
            $img = $null
            
            # Save the compressed image
            # If PNG, save as PNG (preserves transparency). If JPG/JPEG, save as JPEG.
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            if ($ext -eq ".png") {
                $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
            } else {
                $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
            }
            
            # Dispose resources
            $graph.Dispose()
            $bmp.Dispose()
            
            $newSize = (Get-Item $filePath).Length
            Write-Host "  -> Done: $($newWidth)x$($newHeight), $([Math]::Round($newSize/1KB, 2)) KB"
        } else {
            $img.Dispose()
        }
    } catch {
        Write-Error "Error processing $filePath : $_"
        if ($img -ne $null) { $img.Dispose() }
    }
}

# Find all images and compress them
Get-ChildItem -Path $srcFolder -Include *.png, *.jpg, *.jpeg -Recurse | ForEach-Object {
    Compress-Image -filePath $_.FullName -maxDimension $maxDim
}
