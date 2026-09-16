$f = ".\safiyan-frontend\src\pages\vendor\VendorProducts.jsx"
$content = Get-Content $f -Raw
$content = $content.Replace('localStorage.getItem("token")', 'localStorage.getItem("sies-auth-token")')
$content = $content.Replace('sessionStorage.getItem("token")', 'sessionStorage.getItem("sies-auth-token")')
Set-Content $f $content -NoNewline
Write-Host "Fixed: $f"