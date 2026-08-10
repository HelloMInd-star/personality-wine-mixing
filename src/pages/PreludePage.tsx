/**
 * PreludePage · Y.Mine 概念预告
 *
 * 一段从宇宙到地面的连续视觉叙事：
 *   星空 → 银河转动 → 塔罗揭晓 → 视角下坠 → 城市 → 牌铺开 →
 *   地球行走 → 太阳/图标/月光 → 引导词 → 进入系统
 *
 * 拆分为三个子组件：
 *   - PreludeIntro · 阶段管理 + Canvas 渲染 + 跳过/引导词
 *   - PreludeNarrative · 视觉叙事层（塔罗/下坠/城市/地球/日月/终章）
 *   - PreludeCTA · 交互入口（星场触发 + 终章探索入口）
 */

export { default } from './prelude/PreludeIntro';
export type { StageId, StageDef } from './prelude/PreludeIntro';
export { STAGES } from './prelude/PreludeIntro';