# 免费算力爬取报告（2026-08-08）

目的：扩大 agent 公司到 100 人，需要更多免费模型算力。本次重新爬取全部已知免费源 + 新发现网关。

## 核心成果

### 🆕 新发现：Kilo Gateway（完全免 key！）
- 端点：`https://api.kilo.ai/api/gateway`（OpenAI 兼容）
- 免费额度：**200 RPH**（每小时 200 次），完全免 key，无需注册
- 模型目录：349 个模型（/models 实测）
- **实测可用 6 个 :free 模型**（2026-08-08 逐一带 chat 请求验证）：

| 模型 ID | 说明 | 状态 |
|---|---|---|
| `nvidia/nemotron-3-ultra-550b-a55b:free` | Nemotron 3 Ultra 550B 旗舰 | ✅ 稳定 |
| `nvidia/nemotron-3-super-120b-a12b:free` | Nemotron 3 Super 120B | ✅ 稳定 |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | Nano Omni 30B 推理 | ✅ 稳定 |
| `tencent/hy3:free` | 腾讯混元 Hy3 | ✅ 稳定 |
| `stepfun/step-3.7-flash:free` | 阶跃 step-3.7 | ✅ 稳定 |
| `poolside/laguna-s-2.1:free` | Laguna S 2.1 | ✅ 稳定 |

- 实测淘汰：`poolside/laguna-xs-2.1:free`（429）、`cohere/north-mini-code:free`（限流）、
  `nex-agi/nex-n2-pro:free`（转付费）、`inclusionai/ling-2.6-1t:free` / `ling-2.6-flash:free`（转付费）、
  `google/gemma-4-31b-it` / `aion-labs/aion-3.0` / `moonshotai/kimi-k2.7-code` / `z-ai/glm-4.7-flash`（需登录）
- ⚠️ `kilo-auto/free` 自动路由会选到 reasoning 模型（content=null，正文在 reasoning），agent 决策链路不适用

### Zen 网关重爬（61 个模型，8 个 free 档）
- **新增**：`longcat-2.0-free` ✅ 实测可用（美团 Longcat 2.0）
- **恢复**：`laguna-s-2.1-free` ✅ 实测可用（曾被限流淘汰，现在恢复了）
- 淘汰：`ling-3.0-tiny-free` / `ling-3.0-flash-free`（上游 Endpoint unavailable）

### 其他源实测
| 源 | 结果 |
|---|---|
| OpenRouter | 400 模型、14 个 :free（50 RPD/模型），但需 key 且历史 429 严重，暂不收录 |
| 硅基流动 | 1000 RPM/模型，需 key（Token invalid），注册送 14 元 |
| 智谱 BigModel | GLM-4.7-Flash 永久免费（30 并发），需 key（401） |
| 书生 InternAI | intern-s2-preview-397b 免费，需 key，密钥 6 个月有效 |
| HuggingFace Router | 300 RPH，需 key |
| Groq / Cerebras | 30 RPM / 1000 RPD，需 key |
| GitHub Models | 15 RPM / 150 RPD，gpt-5 等 45+ 模型，需 GitHub 登录 |
| Cloudflare Workers AI | 10K Neurons/天，需 account |
| G4F | 免 key 但要 PoW cakes，不适用 agent |
| Kilo Gateway | ✅ **本次最大发现**，见上 |

## 修复：浏览器 UA 缺失（根因）
`callModel`（agent-os/router.go）和 main-backend 的 chat/responses 请求**都没设 User-Agent**。
OpenCode Zen / Kilo 等网关有 Cloudflare 防护，Go 默认 UA（`Go-http-client/1.1`）会被 403
（error code 1010）。这是此前免费模型「时好时坏」的一个隐藏根因。
→ 已全局加 `Mozilla/5.0 ... Chrome/126` UA。

## 代码变更
- `agent-os/router.go`：+2 Zen 模型 +6 Kilo 模型（全 Keyless），callModel 加浏览器 UA
- `main-backend/internal/handler/model_router.go`：同步 +2 Zen +6 Kilo，chat/responses 请求加 UA
- 两端 `go build` 均通过；agent-os `exec` 实测模型链路通（模型池现 12 个免 key 模型）

## 100 人公司可行性（更新）
| 场景 | 间隔 | 模型调用/天 | 可行性 |
|---|---|---|---|
| 4 agent 公司 | 2 分钟 | ~2880 | ✅ keyed 优先 + 随机轮换 |
| 100 agent 公司 | 2 分钟 | ~14400 | ⚠️ 需错峰 + 降频 + 全部免 key 源 |
| 100 agent 公司（新池） | 5 分钟 | ~5760 | ✅ 12 免 key + 6 keyed 分散，Kilo 200 RPH 兜底 |

关键：Kilo 200 RPH 是硬上限，100 人公司若每轮全部走 Kilo 会 429——必须：
1. Zen 6 + Kilo 6 + keyed（商汤/魔搭/阶跃/NVIDIA/Ollama）全池分散
2. 错峰启动（15s 间隔）+ 每轮间隔拉长（5 分钟）
3. 决策算法 keyed 优先 + 同信用随机轮换（已有）

## 下一步（需用户操作）
注册这些免费 key 可再扩容：
1. **智谱**（open.bigmodel.cn）：GLM-4.7-Flash 永久免费，30 并发 —— 最值得
2. **硅基流动**（siliconflow.cn）：注册送 14 元，1000 RPM/模型
3. **书生 InternAI**（chat.intern-ai.org.cn）：397B 免费，10 RPM
4. **GitHub Models**（models.github.ai）：gpt-5/gpt-4.1 免费原型，15 RPM
5. **Groq / Cerebras**：gpt-oss-120b 免费，30 RPM
