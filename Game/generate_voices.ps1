$voicevoxUrl = "http://localhost:50021"
$storyPath = "public/data/dlc/storyScript_ja.json"
$outputDir = "public/voice"

# 角色默认音色映射
$characterVoice = @{
    "ain" = 14         # 冥鳴ひまり（女主）
    "freyja" = 8       # 春日部つむぎ
    "liz" = 2          # 四国めたん
    "default" = 14
}

# 各角色在不同语气下的风格 ID
$voiceStyleMap = @{
    "normal"   = @{ "ain" = 14; "freyja" = 8; "liz" = 2  }
    "sweet"    = @{ "ain" = 14; "freyja" = 8; "liz" = 0  }
    "angry"    = @{ "ain" = 14; "freyja" = 8; "liz" = 6  }
    "sexy"     = @{ "ain" = 14; "freyja" = 8; "liz" = 4  }
    "whisper"  = @{ "ain" = 14; "freyja" = 8; "liz" = 36 }
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$story = Get-Content $storyPath -Raw | ConvertFrom-Json
$total = ($story.PSObject.Properties | Measure-Object).Count
$current = 0

foreach ($nodeId in $story.PSObject.Properties.Name) {
    $current++
    $node = $story.$nodeId
    $text = if ($node.text_ja) { $node.text_ja } else { $node.text }
    $speaker = if ($node.speaker) { $node.speaker } else { "narrator" }

    # 跳过旁白，不生成语音
    if ($speaker -eq "narrator") {
        Write-Host "[$current/$total] 跳过旁白: $nodeId"
        continue
    }

    if (-not $text) { continue }

    $filename = "${outputDir}/${speaker}_${nodeId}.wav"
    if (Test-Path $filename) {
        Write-Host "[$current/$total] 跳过: $filename"
        continue
    }

    # 根据 voiceStyle 选择语气 ID，没有则用 normal
    $style = if ($node.voiceStyle) { $node.voiceStyle } else { "normal" }
    $styleId = $voiceStyleMap[$style][$speaker]
    if (-not $styleId) { $styleId = $characterVoice[$speaker] }
    if (-not $styleId) { $styleId = $characterVoice["default"] }

    Write-Host "[$current/$total] 生成: ${speaker}_${nodeId}.wav (语气:$style, ID:$styleId)"

    $queryUrl = "${voicevoxUrl}/audio_query?text=${text}&speaker=${styleId}"
    try {
        $queryResp = Invoke-RestMethod -Uri $queryUrl -Method Post -ContentType "application/json"
    } catch {
        Write-Host "  ❌ 查询失败: $_"
        continue
    }

    $synthUrl = "${voicevoxUrl}/synthesis?speaker=${styleId}"
    $bodyJson = ConvertTo-Json $queryResp -Depth 10
    try {
        Invoke-RestMethod -Uri $synthUrl -Method Post -ContentType "application/json" -Body $bodyJson -OutFile $filename
        Write-Host "  ✅ 生成成功"
    } catch {
        Write-Host "  ❌ 合成失败: $_"
    }
    Start-Sleep -Milliseconds 300
}

Write-Host "`n🎉 全部完成！共处理 $total 个节点"