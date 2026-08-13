# Rescene v0.1.3-alpha.2 — 精确模型 failover 铁律实装版

> 重大修复：非 auto 精确模型彻底禁止偷偷 failover。你选 A，就老老实实跑 A；挂了，就明明白白报错。

## 核心变化

### 🔥 铁律实装：精确模型零 failover（重大修复）

alpha.1 遗留了一个隐形 failover 路径，本次彻底堵死：

- **`HandleAggregateChat`**：此前精确指定模型（非 auto）时，代码会 `append` Auto 全链做兜底——选了 `free_zen_deepseek_v4_flash`，一旦 429 限流，请求会被**悄悄路由到 Auto 链里的其他模型**（混元 / Mimo / Nemotron…），表面还在跑，实际换了模型。**已删除该兜底**：精确模型挂了就明确报错，绝不换人。
- **`modelToAggregateBackends`**：模型名在目录里匹配不到时，此前直接 `return resolveBackends("", "auto")` 回退全链——外部工具填了个陌生模型名，也会被静默替换成 Auto 多源轮换链。**已改为返回空链**，让调用方如实报错。
- **报错区分**：精确模型名未匹配 → `404 模型 "xxx" 未找到（精确模型禁止自动回退，请检查模型名或改用 auto）`；auto 但无可用源 → `503 未配置 key`。
- **报错文案如实点名**：精确模型失败 → `模型 <name> 请求失败: HTTP 429...`（不再笼统说"所有免费模型均失败"——那句是误导 failover 的元凶）；auto 多源全灭才说"所有免费模型均失败（已尝试: A → B → C）"。

### ✅ 行为对齐铁律（2026-08-13）

| 请求 model | 行为 |
|---|---|
| `auto` / `rescene-auto` / 空 | Auto 全链（探活信号 + LRU 排序 + 秒切 failover，设计如此） |
| 精确模型 ID / 模型名 | **只路由到那一个**，失败明确报错，零 failover |
| 未知模型名 | 404 明确报错，绝不回退 Auto |

## 发版说明

- 版本：**v0.1.3-alpha.2**
- 内部 tag：`ginnungagap_v0.0.10`
- 安装包通过官网下载页分发（需邀请码）
- 部署安装目录：Wails 桌面版 `build/bin/rescene.exe`
