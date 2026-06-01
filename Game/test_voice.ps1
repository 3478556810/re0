$voicevoxUrl = "http://localhost:50021"
Add-Type -AssemblyName System.Web

# 芙蕾雅 (春日部つむぎ, ID 8)
$text1 = "こんにちは、私はフレイヤです。"
$encoded1 = [System.Uri]::EscapeDataString($text1)
$queryUrl1 = "${voicevoxUrl}/audio_query?text=${encoded1}&speaker=8"
Write-Host "请求 URL: $queryUrl1"
try {
    $query1 = Invoke-RestMethod -Uri $queryUrl1 -Method Post -ContentType "application/json"
    $body1 = ConvertTo-Json $query1 -Depth 10
    Invoke-RestMethod -Uri "${voicevoxUrl}/synthesis?speaker=8" -Method Post -ContentType "application/json" -Body $body1 -OutFile "public/voice/freyja_test.wav"
    Write-Host "✅ 芙蕾雅测试语音生成完毕 (ID 8)"
} catch {
    Write-Host "❌ 芙蕾雅生成失败: $_"
}

# 艾因 (冥鳴ひまり, ID 14)
$text2 = "こんにちは、私はアインです。"
$encoded2 = [System.Uri]::EscapeDataString($text2)
$queryUrl2 = "${voicevoxUrl}/audio_query?text=${encoded2}&speaker=14"
Write-Host "请求 URL: $queryUrl2"
try {
    $query2 = Invoke-RestMethod -Uri $queryUrl2 -Method Post -ContentType "application/json"
    $body2 = ConvertTo-Json $query2 -Depth 10
    Invoke-RestMethod -Uri "${voicevoxUrl}/synthesis?speaker=14" -Method Post -ContentType "application/json" -Body $body2 -OutFile "public/voice/ain_test.wav"
    Write-Host "✅ 艾因测试语音生成完毕 (ID 14)"
} catch {
    Write-Host "❌ 艾因生成失败: $_"
}