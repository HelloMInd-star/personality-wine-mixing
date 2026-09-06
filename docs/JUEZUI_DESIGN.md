# JUEZUI · 觉醉 设计调性规范 v1.0

> 觉醉 · 感官情绪探索游戏。本规范是全部页面视觉与交互的执行标准——定调于此，后续所有页面按此推进。
> 基因溯源：Spotify（内容优先暗色 / 单一功能强调色 / pill 几何）+ PlayStation（安静 chrome / 图像与氛围干重活）+ ElevenLabs（氛围光斑是唯一色彩时刻 / 编辑感字重）。

---

## 1. 画布与氛围

- 深空近黑画布（`void-gradient`: #2d1b4e → #15102e → #070414），UI 退后，让"镜月 / 星球 / 酒杯"等内容发光
- 氛围元素干重活：星尘、光斑、辉光是页面的主要"色彩时刻"，chrome 本身保持安静
- 玻璃拟态分层：`glass`（基底）→ `glass-gold`（重要内容卡）→ 实心 gold-sheen（唯一主 CTA）

## 2. 色彩 · 7:2:1 + ORBIT 状态语义

| 角色 | 色 | 用法 |
|---|---|---|
| 画布 7 | void 深空系 | 背景、容器底 |
| 结构 2 | amethyst 紫 / moon 月白 | 次强调、氛围、正文 |
| 电压 1 | gold 金 | 唯一品牌电压：主 CTA、关键强调、金线分隔 |
| 功能信号 | `orbit-signal` #5BCFA0 | 成功/健康/正向，只做状态不做装饰 |
| 功能信号 | `orbit-accent` #6FA8FF | 焦点/高亮，只做状态不做装饰 |
| 功能信号 | `orbit-alert` #FF6B6B | 警告/负向/错误（如登录报错），替代零散 rose/red |

规则：金不与紫抢面积；状态色永不进入装饰层；同一元素最多一个发光（glow）。

## 3. 字体排版

- 大标题：`font-display`（Noto Serif SC）+ `text-gold-sheen`；分区标题统一 `tracking-[0.12em]`
- eyebrow 标签系统：`text-[11px] / tracking-[0.6em] / mb-3`，可带一枚呼吸点（分区角色决定 signal 或 accent）
- 正文：`text-moon-200/50~70`，`leading-relaxed`
- 微标签（10px 级）：`tracking-[0.3em]~[0.4em]`，英文可用 uppercase（编辑感）

## 4. 几何 · 三档圆角

`rounded-card`(48px) 大容器 / `rounded-capsule`(28px) 表单与中容器 / `rounded-pill`(100px) 按钮与小标签；圆形控制件用 50%。进度条与装饰圆保持 full。

## 5. 动效

- 统一过渡：`duration-orbit-mid`(240ms) + `ease-orbit` cubic-bezier(.2,.7,.2,1)
- 入场：`animate-orbit-fade-up`；呼吸点：`animate-orbit-pulse`；重入场可用 `duration-orbit-slow`(380ms)
- 编排原则：一次精心编排的页面入场（staggered）胜过散落的小动效；hover 反馈 = 上浮 or 提亮 or 辉光，三选一
- 随机视觉元素（星尘等）必须 `useMemo` 固定，禁止写在 render 里

## 6. 间距节奏

分区间距三级：Hero 后 48px（`mb-12`）→ 主分区之间 64px（`mb-16` / `mt-16`）→ 页尾收束 32px（`mt-8`）。分区自身用 `pb-12`，上间距一律由前一元素 mb 提供（单一来源）。卡内间距服从 8 的倍数。

## 7. 交互流程

- 每个浏览动线节点必须有明确去向：卡片可点（GlassPanel `onClick` + `hover` 自动获得 cursor/上浮/辉光）
- 输入类：focus 即反馈（边框金 + 紫光晕 240ms）；报错后"输入即清错"
- 低门槛路径显性化：新客一键直达（免填表），等待态有文字反馈（"入镜中..."）
- 死链零容忍：新增任何 `navigate` / `route` / `to` 目标必须先在 App.tsx 路由表确认存在

## 8. Do's and Don'ts

✅ 一页一个视觉高潮；eyebrow 体系贯穿全站；hover 三选一；状态色只进功能层
❌ 紫渐变铺白底的通用 AI 风；零散 rose/red 替代 orbit-alert；装饰性发光堆叠；UI 文案暴露"Mock/测试"字样；随机值进 render

## 9. 逐页推进清单

动线：HomePage ✅ → LoginPage ✅ → 镜中自观 → Hub → Tavern → Cards/Poker → 其余按此调性统一。
