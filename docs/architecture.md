# 觉醉架构技术文档

> 主题：人格引擎 × 调酒引擎 → 统一 Service 层整合
> 版本：v1.0 · 2026-08-07
> 范围：前端调用链收敛、分层职责重划、类型与测试验证

---

## 1. 背景与目标

### 1.1 调整前现状

觉醉 的核心业务由两个独立引擎承载：

- `personalityEngine` — 大五人格 OCEAN 计分、原型匹配、风味偏好生成
- `cocktailEngine` — 余弦相似度推荐、原型亲和、关键词搜索、情绪筛选

引擎本身是纯函数、可独立测试，但在整合前，**前端层（hooks / store）直接 import 引擎函数**，导致以下问题：

| 问题 | 表现 |
|---|---|
| 调用入口分散 | `usePersonality` 直接调 `buildProfile`，`useCocktail` 直接调 4 个 engine 函数，`appStore` 直接操作 `localStorage` |
| 业务编排缺失 | 「答案 → 画像 → 推荐」这一典型业务流被迫在组件层手工串接 |
| 持久化逻辑泄漏 | localStorage key 与异常降级策略散落在 store，难以统一治理 |
| 替换成本高 | 若未来引擎升级或换实现，需多点修改 |

### 1.2 调整目标

引入 **`cocktailService` 作为唯一业务编排层**，达成：

1. 前端只依赖 service，不再直接 import engine
2. 业务流程（含持久化）集中在 service 内闭环
3. 引擎保持纯函数特性，可独立单测
4. 对外接口稳定，下层实现可替换

---

## 2. 调整后分层架构

```
┌─────────────────────────────────────────────────────┐
│  UI 层 · pages / components                         │
│  PersonalityPage · CocktailPage · HomePage · ...    │
└───────────────────────┬─────────────────────────────┘
                        │ 仅消费 hooks/store 返回的状态
┌───────────────────────▼─────────────────────────────┐
│  状态层 · hooks / store                             │
│  usePersonality · useCocktail · appStore            │
│  职责：React 状态机、副作用调度、UI 友好返回结构    │
└───────────────────────┬─────────────────────────────┘
                        │ 仅调用 cocktailService
┌───────────────────────▼─────────────────────────────┐
│  Service 层 · cocktailService (本次新增)            │
│  职责：业务编排、组合调用、localStorage 持久化      │
│  规则：无 React 依赖、无副作用泄漏、可被任意层调用  │
└───────────────────────┬─────────────────────────────┘
                        │ 调用纯函数
┌───────────────────────▼─────────────────────────────┐
│  Engine 层 · personalityEngine / cocktailEngine     │
│  职责：领域计算（计分、相似度、推荐排序）           │
│  规则：纯函数、零副作用、零 IO、可独立单测          │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│  Data 层 · data/                                    │
│  PERSONALITY_QUESTIONS · COCKTAILS · FLAVOR_META... │
└─────────────────────────────────────────────────────┘
```

### 2.1 分层约定

| 层 | 允许依赖 | 禁止依赖 |
|---|---|---|
| UI | hooks、store、types | engine、service、data |
| hooks / store | service、types | engine、data |
| service | engine、data、types | React、UI |
| engine | data、types | React、UI、service、IO |
| data | types | 任何业务层 |

> 一句话约束：**依赖方向严格自上而下，引擎永不被前端直接 import。**

---

## 3. cocktailService API 总览

文件：`src/services/cocktailService.ts`

### 3.1 人格画像

| 方法 | 签名 | 说明 |
|---|---|---|
| `generateProfile` | `(answers) => PersonalityProfile` | 答案 → 完整画像（计分+原型+风味偏好） |
| `generateProfileAndRecommendations` | `(answers, limit=5) => { profile, recommendations }` | 一站式：画像 + 推荐一并返回 |

### 3.2 调酒推荐（三条路径）

| 方法 | 签名 | 适用场景 |
|---|---|---|
| `recommendByProfile` | `(profile, limit=5) => CocktailRecommendation[]` | 已有完整画像 |
| `recommendByPreference` | `(preference, limit=5) => CocktailRecommendation[]` | 仅需风味偏好，无完整画像 |
| `recommendByArchetype` | `(archetypeCode, limit=5) => CocktailRecommendation[]` | 按人格原型亲和推荐 |

### 3.3 单一查询

| 方法 | 签名 |
|---|---|
| `getCocktail` | `(id) => Cocktail \| undefined` |
| `searchCocktails` | `(keyword) => Cocktail[]` |
| `filterByMood` | `(mood) => Cocktail[]` |
| `getAllCocktails` | `() => Cocktail[]` |

### 3.4 元数据

| 方法 | 返回 |
|---|---|
| `getTraits` | `TraitMeta[]`（五维） |
| `getArchetypes` | `PersonalityArchetype[]` |
| `getFlavors` | `FlavorMeta[]`（八维） |

### 3.5 画像持久化

| 方法 | 行为 | 异常策略 |
|---|---|---|
| `saveProfile(profile)` | 写入 localStorage | 存储不可用 → 静默降级 |
| `loadProfile()` | 读取并 JSON.parse | 解析失败/不存在 → 返回 `null` |
| `clearProfile()` | 移除键 | 同上 |

存储键：`juezui-profile`

---

## 4. 端到端调用链

### 4.1 人格测评完成 → 推荐落地

```
用户答完第 30 题
    │
    ▼
QuestionCard onSelect(value)
    │
    ▼
usePersonality.answer(qid, value)
    │  answers 长度 ≥ TOTAL_QUESTIONS
    ▼
cocktailService.generateProfile(updated)   ← service 介入
    │  内部：buildProfile → calculateScores + matchArchetype + generateFlavorPreference
    ▼
setProfile(result) · setStatus('done')
    │
    ▼
PersonalityPage 「查看专属调酒」按钮
    │
    ▼
appStore.saveProfile(profile)
    │  委托
    ▼
cocktailService.saveProfile(profile)        ← 持久化统一入口
    │
    ▼
navigate('/cocktail')
```

### 4.2 调酒页加载 → 推荐刷新

```
CocktailPage 挂载
    │
    ▼
useCocktail(profile?.flavorPreference)      ← 初始偏好惰性生成首批推荐
    │  内部首渲染：cocktailService.recommendByPreference(initialPreference)
    ▼
useEffect[profile?.flavorPreference] 触发
    │
    ▼
refreshRecommendations(profile.flavorPreference)
    │  委托
    ▼
cocktailService.recommendByPreference(preference, limit)
    │  内部：recommendCocktails → computeFlavorDistance + 排序 + 截断
    ▼
setRecommendations(...)
    │
    ▼
CocktailCard 渲染推荐列表
```

### 4.3 详情 / 搜索 / 情绪筛选

| UI 动作 | 调用链 |
|---|---|
| 点击卡片看详情 | `useCocktail.selectCocktail(id)` → `cocktailService.getCocktail(id)` |
| 搜索框输入 | `useCocktail.search(kw)` → `cocktailService.searchCocktails(kw)` |
| 点击情绪标签 | `useCocktail.filterByMoodTag(mood)` → `cocktailService.filterByMood(mood)` |

---

## 5. 文件变更清单

### 5.1 新增

| 文件 | 作用 |
|---|---|
| `src/services/cocktailService.ts` | 统一 service 层，15 个 API |

### 5.2 修改

| 文件 | 改动要点 |
|---|---|
| `src/store/appStore.tsx` | localStorage 读写改为委托 `cocktailService.saveProfile/loadProfile/clearProfile` |
| `src/hooks/usePersonality.ts` | `buildProfile` 调用替换为 `cocktailService.generateProfile` |
| `src/hooks/useCocktail.ts` | 4 处 engine 函数调用替换为对应 service 方法（`recommendByPreference` / `getCocktail` / `searchCocktails` / `filterByMood`） |

### 5.3 顺带修复

| 文件 | 问题 | 修复 |
|---|---|---|
| `src/engine/cocktailEngine.test.ts` | `FlavorKey` 误从 `types/personality` 导入（实际在 `types/cocktail`） | 拆分为两条 import |
| `src/engine/personalityEngine.test.ts` | `cases` 数组类型 widen 为 `{ openness: string }`，无法赋给 `Partial<Record<TraitKey, Level>>` | 显式标注 `Partial<Record<TraitKey, Level>>[]` |

### 5.4 未改动（接口稳定）

- `src/pages/PersonalityPage.tsx`、`src/pages/CocktailPage.tsx` — hooks 返回结构未变，零改动
- `src/engine/personalityEngine.ts`、`src/engine/cocktailEngine.ts` — 引擎实现保持纯函数

---

## 6. 验证结果

### 6.1 类型检查

```bash
npx tsc --noEmit
```

结果：**exit 0，0 错误**（修复前 5 处错误全部消除）

### 6.2 单元测试

```bash
npx vitest run
```

结果：

```
✓ src/engine/cocktailEngine.test.ts (31 tests)
✓ src/engine/personalityEngine.test.ts (27 tests)

Test Files  2 passed (2)
     Tests  58 passed (58)
```

### 6.3 验证维度覆盖

| 维度 | 覆盖 |
|---|---|
| 引擎纯函数行为 | 58 个单测全绿 |
| 类型契约 | tsc 严格模式通过 |
| 前端调用链收敛 | hooks/store 中 `import engine` 已清零 |
| 业务编排 | `generateProfileAndRecommendations` 一站式可用 |
| 持久化降级 | try/catch 静默降级，存储不可用不抛错 |

---

## 7. 设计约定

### 7.1 Service 层规则

1. **无 React 依赖** — 不 import React、不调用 hooks，保证可在任意环境（worker / node 测试）使用
2. **业务编排的唯一入口** — 跨引擎组合、流程化操作只在此层出现
3. **副作用收口** — localStorage 仅在 service 出现，engine 永不触碰 IO
4. **异常静默降级** — 持久化相关方法不抛错，避免存储不可用时拖垮 UI

### 7.2 Hooks 层规则

1. **只调 service** — 不再 import engine / data
2. **返回 UI 友好结构** — 状态、动作、派生数据一并返回，组件零计算
3. **状态机职责** — 推进、重置等状态转移逻辑留在 hooks，不下沉到 service

### 7.3 Engine 层规则（保持不变）

1. **纯函数** — 相同输入永远相同输出
2. **零 IO** — 不读 localStorage、不访问 DOM
3. **可独立单测** — 测试无需 mock 任何外部依赖

---

## 8. 后续可演进方向

> 以下为可能的方向，非当前承诺

| 方向 | 描述 | 触发条件 |
|---|---|---|
| 推荐缓存 | 在 service 层加内存缓存，避免相同 preference 重复计算 | 配方库规模扩大到 50+ |
| 异步 service | 若引擎需对接后端 API，service 方法改为 async，hooks 用 Suspense 适配 | 接入真实调酒师创作后台 |
| 多画像存档 | service 持久化从单画像扩展为多画像列表，支持成员切换 | 多用户场景 |
| 推荐理由增强 | `recommendByProfile` 返回结构化 reasons，UI 渲染更丰富的契合说明 | 用户反馈希望看到「为什么是这杯」 |
| 引擎版本化 | service 暴露 `getEngineVersion()`，便于 A/B 测试新算法 | 算法迭代 |

---

## 9. 关键文件索引

| 类别 | 路径 |
|---|---|
| Service | [src/services/cocktailService.ts](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/services/cocktailService.ts) |
| Store | [src/store/appStore.tsx](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/store/appStore.tsx) |
| Hooks | [src/hooks/usePersonality.ts](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/hooks/usePersonality.ts) · [src/hooks/useCocktail.ts](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/hooks/useCocktail.ts) |
| Engine | [src/engine/personalityEngine.ts](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/engine/personalityEngine.ts) · [src/engine/cocktailEngine.ts](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/engine/cocktailEngine.ts) |
| Tests | [src/engine/personalityEngine.test.ts](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/engine/personalityEngine.test.ts) · [src/engine/cocktailEngine.test.ts](file:///e:/Y.Mine%20%E4%BA%BA%E6%A0%BC%E8%B0%83%E9%85%92%E7%B3%BB%E7%BB%9F%20%C2%B7%20%E5%AE%8C%E6%95%B4%E6%8A%80%E6%9C%AF%E5%BC%80%E5%8F%91%E6%96%B9%E6%A1%88/src/engine/cocktailEngine.test.ts) |

---

**END**
