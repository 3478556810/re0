# Rescene v0.1.3-alpha.1 — DS 特供版

> 宁缺勿滥。聚合端口只提供世界顶级模型，不再提供垃圾模型。

## 核心变化

### 🔥 聚合端口 DeepSeek 特供

聚合 API（`/v1/models` + `/v1/chat/completions`）全面升级为 **DeepSeek 特供版**：

- **只暴露 DeepSeek V4 系**（V4-Flash / V4-Pro），实测可用、质量顶级的模型
- **排除低版本**：v3.x / r1 / chat / coder 等实测不可用的版本不再出现
- **排除付费墙提供方**：Kilo（401）、Ollama Cloud（403）等挂着占列表、选了必挂的提供方直接淘汰
- 对外接口干净简洁：`auto` + 可用 DeepSeek V4 模型列表

### ⚡ 智能路由增强

- 精确模型 429/404 时 **自动 failover 到 Auto 全链**，外部工具（Hermes / Codex 等）不会因为某个源限流就断连
- 付费墙模型自动探测淘汰，**恢复自动拉起**
- 聚合端口探活覆盖 `auto_` 发现模型，确定性错误淘汰，存活模型保活

### ✅ 不影响 Rescene 应用

- 内部 628 免费模型池完全不受影响
- 只在对外聚合接口（外部工具接入）做筛选
- Rescene 管理面板 / 自由池 / 公司面板等内部功能保持全量模型

## 发版说明

- 版本：**v0.1.3-alpha.1**
- 内部 tag：`ginnungagap_v0.0.9`
- 安装包通过官网下载页分发（需邀请码）
- 部署安装目录：Wails 桌面版 `build/bin/rescene.exe`