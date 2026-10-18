$jdkHome = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:JAVA_HOME = $jdkHome
$javaExe = "$jdkHome\bin\java.exe"
if (-not (Test-Path $javaExe)) {
    $javaExe = "java"
}
& $javaExe -jar .\gradle\wrapper\gradle-wrapper.jar @args
