# 更新日志 · 觉醉品牌战略升级与历次迭代

**日期**:2026-09-03
**范围**:觉醉品牌战略升级（定位/品牌名/用户画像/视觉对标/13 page 改文案/感官轴 P0 扩展/全仓改品牌名/7 engine brand 字符串/D 段重写）

---

## 战略对齐

### 产品定位

- **新定位**：觉醉 · **感官情绪探索游戏**（不是工具，是镜中自观+调酒仪式+情绪反馈的循环玩物）
- 旧定位"MBTI 人格调酒系统"降为子线
- 叙事核心：镜中自观 → 调酒仪式 → 情绪反馈 → 感官在夜里循环

### 品牌名

- **新品牌名**：觉醉 JueZui（英文 Juezui / 拼音 juezui）
- 取代旧"Y.Mine / 人格调酒"
- 5 候选中唯一同时承载「调酒+心理+玩」三义的，调性最强

### 用户画像

- 50% 主力：25-32 都市创意人
- 35% 泛用户：22-38 体验派
- 15% 长尾：心理/玄学/调酒从业者

### 视觉对标

- Spotify（沉浸+深绿）+ PlayStation（暗夜+情绪）+ ElevenLabs（AI 沉浸+电影风）
- 主推语言：「深空暗紫 + 情绪光斑 + 紫金点缀」

### 竞品参考

- Headspace/Calm（情绪冥想）+ Cocktail Flow（调酒工具）+ Endel（沉浸音景）
- 16Personalities（MBTI 测试）+ 叨叨记账（情绪记账）

---

## 文案改动

### 12/13 原清单 page 改完（ScentLabPage 不存在跳过）

| page | 改动 |
|---|---|
| HomePage | 战略定位段 + 镜月入口强化 |
| HubPage | 星球枢纽叙事诗化 |
| ExplorePage | 五维探索沉浸化 |
| **PersonalityPage** | h1「镜中自观·觉醉」+ IdleView 描述去工具感 |
| CardsPage | 牌类采集叙事诗化 |
| **ChessPage** | 注释「觉醉·棋局自观」+ 「采集」→「自观」4 处 |
| **CocktailPage** | 注释「觉醉·调酒·一杯一注脚」 |
| MbtiPartyPage | 多人 MBTI 酒局融合叙事化 |
| **TavernPage** | 注释「觉醉·酒馆夜场」 |
| **BarCounterPage** | h1「吧台·一杯一世界」+ 注释 |
| MindLibraryPage | 注释加觉醉调性 |
| **InvestPage** | 注释「觉醉·灵感实验室」 |

### 4 感官轴 P0 扩展（新增）

| page | eyebrow | 战略定位 |
|---|---|---|
| **BrewScentPage** | 觉醉·酿·香·Scent Lab | 嗅觉轴 |
| **BrewMusicPage** | 觉醉·酿·乐·Music Engine | 听觉轴 |
| **BrewMolecularPage** | 觉醉·酿·分子·Flavor Engineering | 味觉/嗅觉轴 |
| **BrewLightPage** | 觉醉·酿·光·Light Canvas | 视觉轴 |

### 7 engine 文件仅 brand 字符串（保留 0 逻辑改动）

`gameTheoryEngine.ts` / `logger.ts` / `musicProfileEngine.ts` / `personaFusionEngine.ts` / `personaMusicEngine.ts` / `pokerHistoryStore.ts` / `sandboxEngine.ts`
11 处改 11 处 = 注释 + STORAGE_KEY + log 标签

### 其他 brand 字符串

`App.tsx` / `Sidebar.tsx` / `SandboxSpace.tsx` / `CocktailBuilder.tsx` / `CocktailRevealStage.tsx` / `MbtiCardRevealStage.tsx` / `SevenDimensionalRadar.tsx` / `cardCustomization.ts` / `flavorMapping.ts` / `useGameTheory.ts` / `index.css` / `BrewScentPage.tsx` 等

### 保留项（4 类不改）

- 测试文件 localStorage key（`y-mine-*`）
- Windows 路径含 Y.Mine（`docs/architecture.md`）
- 仓库 URL（`ymine-validation-hub`）
- 闭源注释

---

## D 段重写

| 文件 | 改动 |
|---|---|
| `README.md` | 标题「觉醉·感官情绪探索游戏」+ 战略定位段 + 生态段 + 功能矩阵全改 |
| `docs/ROADMAP.md` | 加 Phase 5「觉醉品牌战略升级」+ 5.1-5.6 子段 + 更新日期 2026-09-03 |
| `docs/changelog.md` | 本段（2026-09-03 条目） |
| `package.json` | name `juezui-personality-cocktail` + description 加战略定位 |
| `index.html` | title + meta 同步 |

---

## 验收

- 静态验证：残留 Y.Mine 7 处全在保留列表；觉醉覆盖率 45 文件
- 12 page hero/cta/section 关键 ID 抽查：项目用 className 为主（符合 React 惯例）
- 浏览器实测待用户在 https://hellomind-star.github.io/personality-wine-mixing/ 跑通

---

## 后续待办

- [ ] A 段子 session 修 5 个 journey 集成测试（场景 2/3/4/5/7，根因疑似 MoodDial intensity）
- [ ] 用户本地 `npm install && npm run lint && npm test` 验证
- [ ] `npm run dev` 浏览器实测 16 page 文案
- [ ] 推 GitHub（8+ commit，用 personality-wine-mixing 新 PAT）
- [ ] 推完后 revoke 新旧 PAT
- [ ] 后续 P1 扩展：3 page（BrewJourney / Balance / Login 二核）+ 单独评估 PokerPage

---

# 更新日志 · 极客程序员叙事转换

**日期**:2026-08-08

---

## 文案改动

### hostData.ts · 状态文案

| 时段 | 状态标签 | 提示词 |
|---|---|---|
| night/dusk | 营业中 → **编译中** | 主理人已就位,今夜随你挑 → **人格已就位,今夜为自己调一杯** |
| dawn | 备料中 → **收尾中** | 正在备料,稍候片刻 → **正在提交最后的代码** |
| noon | 离线 → **补眠中** | 主理人不在吧台,工作完再来 → **白天在睡,夜了再上线** |
| midnight | 打烊 → **已关机** | 吧台已收,该歇了 → **该歇了,代码明天再写** |
| 无画像 | 镜空(保留) | 让主理人现身 → **让镜中的程序员显形** |

### hostData.ts · 页面提示

| 路由 | 改动 |
|---|---|
| /personality | 让镜中的主理人显形 → **让镜中的程序员显形** |
| /cocktail | 主理人正为你挑一杯契合今夜的酒 → **用你的人格,给自己调一杯契合今夜的酒** |
| 兜底 | 主理人在此等候 → **程序员在此等候** |

### HomePage.tsx · 主理人 section

- **描述文案**:人格化身 → **极客化身**;为你调一杯 → **用你的人格给自己调一杯**
- **无画像引导态**(测试中发现遗漏):完成测评 · 让主理人现身 → **完成测评 · 让镜中的程序员显形**

### HostPanel.tsx · 引导按钮

- 完成测评 · 让主理人现身 → → **完成测评 · 让镜中的程序员显形 →**

### Sidebar.tsx · 分组注释

- 消费层 · 为你调什么 → **消费层 · 给自己调什么**

---

## 保留项(中性品牌词,非服务叙事)

- "主理人"品牌词保留(HostBadge aria-label / HostPanel 分区标签 / HomePage 标题"主理人·镜中之你")
- CocktailBuilder.tsx "夜为你调的一则注脚"(夜的环境拟人,非主理人服务叙事)

---

## 新增文件

| 文件 | 说明 |
|---|---|
| src/pages/MindLibraryPage.tsx | 思维库骨架页(六重底座 + 五层架构) |
| src/pages/MindLibraryPage.test.tsx | 骨架页测试 · 6 用例 |
| src/pages/HomePage.test.tsx | 占位卡片 + 极客叙事测试 · 8 用例 |

## 路由注册

- App.tsx · `/mind` 路由(懒加载 + ErrorBoundary + Suspense)

---

## 测试结果

- 2 文件 / 14 用例 / 全部通过 / 4.94s
- 过程中修复:HomePage 无画像引导态文案遗漏 + 两处多匹配(getAllByText)
