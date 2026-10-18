# Script to generate production release keystore for Google Play Store upload
$keytool = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot\bin\keytool.exe"
if (-not (Test-Path $keytool)) {
    $keytool = "keytool"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Generating Release Keystore for Google Play Store..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

& $keytool -genkeypair -v -keystore .\release.keystore -alias yagya-release-key -keyalg RSA -keysize 2048 -validity 10000 -storepass yagya2026 -keypass yagya2026 -dname "CN=Maharishi Bharat Utkarsh, OU=Yagya Samiti, O=Bharat Utkarsh, L=Noida, ST=Uttar Pradesh, C=IN"

if (Test-Path ".\release.keystore") {
    Write-Host "`nSUCCESS! Release keystore created at: .\release.keystore" -ForegroundColor Green
    Write-Host "Keystore Password: yagya2026" -ForegroundColor Yellow
    Write-Host "Key Alias: yagya-release-key" -ForegroundColor Yellow
    Write-Host "Key Password: yagya2026" -ForegroundColor Yellow
    Write-Host "KEEP THIS FILE SAFE! You will need it to sign all future app updates." -ForegroundColor Red
} else {
    Write-Host "Failed to create keystore." -ForegroundColor Red
}
