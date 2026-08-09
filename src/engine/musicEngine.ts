/**
 * musicEngine · 程序化氛围音乐合成引擎
 * 用 AudioContext 实时合成四阶段的深空氛围音，零音频文件依赖
 *
 * 合成拓扑（每曲目）：
 *   noiseSource(白噪音 buffer 循环) → noiseFilter(lowpass 柔化) → noiseGain ─┐
 *   padOsc(根音) ┐                                                            │
 *   padOsc(五度) ┴→ lowpassFilter ← LFO(呼吸调制) → padGain(压低) ────────────┤→ masterGain → destination
 *   beatOsc(BPM 脉冲) → beatGain ─────────────────────────────────────────────┘
 *
 * 白噪音柔和化设计：
 *   - 噪音 buffer 预生成 2 秒循环 · 首次创建后缓存复用
 *   - lowpass 滤波频率随阶段能量递增 · opening 棕噪音感 → climax 宽频带
 *   - pad 振荡器音量压低至 0.15 · 仅作和声底，避免刺耳
 *   - 噪音为主导底音 · 音量 0.22-0.35 · 柔和包覆感
 *
 * 阶段差异：
 *   opening  · sine  · 低频 · 慢呼吸 LFO · 无节拍 · 棕噪音 350Hz
 *   rising   · triangle · 中频 · 中速 LFO · 弱节拍 · 粉红噪音 800Hz
 *   climax   · sawtooth · 高频 · 快 LFO · 强节拍 + 高能量 · 宽频噪音 1500Hz
 *   closing  · sine  · 回归低频 · 慢呼吸 LFO · 无节拍 · 棕噪音 320Hz
 *
 * 单例导出 · 全局唯一 AudioContext，跨组件共享
 * 浏览器自动播放策略：首次 start 需在用户交互后（由调用方保证）
 */

import type { MusicTrack } from '../types/journey';

/** 活跃音频节点集合 · 用于停止时清理 */
interface ActiveNodes {
  /** 主垫振荡器 · 根音 + 五度 · 音量压低作和声底 */
  padOscs: OscillatorNode[];
  /** 节拍振荡器 · 仅 rising/climax 阶段启用 */
  beatOsc: OscillatorNode | null;
  /** 低通滤波器 · pad 音色塑形 */
  filter: BiquadFilterNode;
  /** LFO 振荡器 · 调制 filter 制造呼吸感 */
  lfo: OscillatorNode;
  /** LFO 增益 · 控制调制深度 */
  lfoGain: GainNode;
  /** 主增益 · 音量与淡入淡出 */
  masterGain: GainNode;
  /** 节拍增益 · 控制节拍音量包络 */
  beatGain: GainNode;
  /** 节拍定时器 · 按 BPM 触发脉冲 */
  beatTimer: number | null;
  /** 白噪音源 · 循环播放预生成 buffer · 情绪柔和底音 */
  noiseSource: AudioBufferSourceNode;
  /** 白噪音滤波器 · lowpass 柔化高频刺耳感 */
  noiseFilter: BiquadFilterNode;
  /** 白噪音增益 · 控制噪音音量与淡入淡出 */
  noiseGain: GainNode;
}

/** 淡入淡出时长 · 平滑过渡避免爆音 */
const FADE_MS = 1200;
/** LFO 基础频率 · 慢呼吸 */
const LFO_BASE_FREQ = 0.12;

class MusicEngine {
  private ctx: AudioContext | null = null;
  private nodes: ActiveNodes | null = null;
  private currentTrack: MusicTrack | null = null;
  private volume = 0.5;
  private playing = false;
  /** 白噪音 buffer 缓存 · 首次生成后复用 · 避免 buildNodes 重复计算 */
  private noiseBuffer: AudioBuffer | null = null;

  /**
   * 懒创建 AudioContext · SSR 与不支持环境安全降级
   * 首次调用时创建；后续复用
   */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        : undefined;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  /**
   * 生成 2 秒白噪音 buffer · 用于情绪底音柔和化
   * 首次创建后缓存复用 · 避免每次 buildNodes 重复生成
   * 单声道 · 样本取 [-1, 1] 均匀分布 · 后续由 noiseFilter 柔化
   */
  private ensureNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  /**
   * 音频合成 logger · 仅 DEV 环境输出 · 用于排查音量突变与阶段切换异常
   * 重点阶段 opening/climax 会输出完整合成参数 + 白噪音参数 + 增益链
   */
  private logSynth(scope: string, detail: Record<string, unknown>): void {
    if (!import.meta.env.DEV) return;
    const ts = performance.now().toFixed(1);
    console.debug(`[Audio:${scope}] t=${ts}ms`, detail);
  }

  /**
   * 关键阶段（opening/climax）时序 logger · console.info 级别突出显示
   * 用于排查音频同步与节点触发时序问题：
   *   - 每个节点的 createAt / startAt（基于 ctx.currentTime · 音频时钟）
   *   - 连接顺序与 ramp 参数
   *   - 节拍脉冲触发时间戳
   *   - 淡出起点与终点
   * 非关键阶段静默 · 避免日志噪音
   */
  private logKeyPhase(scope: string, detail: Record<string, unknown>): void {
    if (!import.meta.env.DEV) return;
    const phase = this.currentTrack?.phase;
    if (phase !== 'opening' && phase !== 'climax') return;
    const ts = performance.now().toFixed(1);
    const ctxTime = this.ctx ? this.ctx.currentTime.toFixed(4) : 'n/a';
    console.info(
      `[Audio:KEY:${scope}] phase=${phase} perf=${ts}ms ctx=${ctxTime}s`,
      detail,
    );
  }

  /** 当前播放曲目 */
  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  /** 是否正在播放 */
  isPlaying(): boolean {
    return this.playing;
  }

  /** 主音量 0-1 */
  getVolume(): number {
    return this.volume;
  }

  /**
   * 启动曲目 · 若已有播放则平滑过渡
   * 同曲目重复调用：幂等，不重启
   */
  start(track: MusicTrack): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    // 浏览器自动播放策略 · 挂起态尝试恢复
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        /* 恢复失败 · 静默 */
      });
    }

    // 同曲目 · 幂等不重启
    if (this.playing && this.currentTrack?.id === track.id) return;

    // 已有播放 · 先过渡淡出再切换
    if (this.playing && this.nodes) {
      this.fadeOutAndStopNodes();
    }

    this.currentTrack = track;
    this.playing = true;
    this.buildNodes(ctx, track);
  }

  /** 停止播放 · 平滑淡出后清理 */
  stop(): void {
    this.logSynth('stop:call', {
      wasPlaying: this.playing,
      trackId: this.currentTrack?.id,
      phase: this.currentTrack?.phase,
      hadNodes: this.nodes !== null,
    });
    if (!this.playing || !this.nodes) {
      this.playing = false;
      this.currentTrack = null;
      return;
    }
    this.fadeOutAndStopNodes();
    this.playing = false;
    this.currentTrack = null;
  }

  /** 设置音量 · 实时作用于 masterGain */
  setVolume(v: number): void {
    const prev = this.volume;
    this.volume = Math.max(0, Math.min(1, v));
    const ctx = this.ctx;
    if (ctx && this.nodes) {
      const now = ctx.currentTime;
      this.nodes.masterGain.gain.cancelScheduledValues(now);
      this.nodes.masterGain.gain.setTargetAtTime(
        this.volume,
        now,
        0.05,
      );
    }
    // ── 音量变化 logger · 排查拖动音量条时的突变 ──
    this.logSynth('setVolume', {
      from: prev.toFixed(3),
      to: this.volume.toFixed(3),
      delta: (this.volume - prev).toFixed(3),
      trackId: this.currentTrack?.id,
      phase: this.currentTrack?.phase,
      appliedToMaster: this.nodes !== null,
    });
  }

  /**
   * 平滑过渡到新曲目 · 等价于 start（已内置淡出淡入）
   * 语义化别名，供 journeyEngine 阶段切换调用
   */
  transitionTo(track: MusicTrack): void {
    this.start(track);
  }

  /** 构建曲目对应的合成节点并淡入 */
  private buildNodes(ctx: AudioContext, track: MusicTrack): void {
    const { synth, bpm, energy } = track;
    const now = ctx.currentTime;

    // ── 合成 logger · 排查音量突变 · opening/climax 重点 ──
    this.logSynth('buildNodes:start', {
      trackId: track.id,
      title: track.title,
      phase: track.phase,
      bpm,
      energy,
      timbre: synth.timbre,
      rootFreq: synth.rootFreq,
      filterFreq: synth.filterFreq,
      reverb: synth.reverb,
      masterVolume: this.volume,
      fadeMs: FADE_MS,
      isKeyPhase: track.phase === 'opening' || track.phase === 'climax',
    });

    // 主增益 · 从 0 淡入到目标音量
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(this.volume, now + FADE_MS / 1000);
    masterGain.connect(ctx.destination);

    // ── KEY 时序 · master 节点创建与淡入 ──
    this.logKeyPhase('master:created', {
      createAt: now,
      rampFrom: 0,
      rampTo: this.volume,
      rampEndAt: now + FADE_MS / 1000,
      connectedTo: 'destination',
    });

    // ── 白噪音底 · 柔和化情绪底音 · 替代刺耳 pad 主导 ──
    // 噪音 buffer 循环 · lowpass 柔化高频 · 增益随能量微调
    const noiseBuffer = this.ensureNoiseBuffer(ctx);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    // 滤波频率随阶段能量递增 · opening 350Hz 棕噪音感 → climax 1500Hz 宽频带
    // 公式：350 + energy * 1150 · energy 0.2→580Hz · 0.5→925Hz · 0.9→1385Hz
    const noiseFilterFreq = 350 + energy * 1150;
    noiseFilter.frequency.setValueAtTime(noiseFilterFreq, now);
    noiseFilter.Q.value = 0.7; // 低 Q 值 · 柔和过渡避免共振刺耳

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    // 噪音音量 0.22-0.35 · 随能量递增 · 始终为主导底音
    const noiseTargetGain = 0.22 + energy * 0.13;
    noiseGain.gain.linearRampToValueAtTime(noiseTargetGain, now + FADE_MS / 1000);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();

    // ── KEY 时序 · 噪音节点链启动 ──
    this.logKeyPhase('noise:started', {
      startAt: now,
      chain: 'noiseSource→noiseFilter→noiseGain→masterGain',
      filterType: 'lowpass',
      filterFreq: noiseFilterFreq,
      filterQ: 0.7,
      gainRampFrom: 0,
      gainRampTo: noiseTargetGain,
      gainRampEndAt: now + FADE_MS / 1000,
      bufferSec: 2,
      loop: true,
    });

    // ── 白噪音参数 logger · 排查阶段切换时噪音音量突变 ──
    this.logSynth('noise:built', {
      phase: track.phase,
      noiseFilterFreq,
      noiseTargetGain,
      noiseQ: 0.7,
      bufferSec: 2,
      rampEnd: now + FADE_MS / 1000,
      // 增益比 · 噪音 / master · 应 < 1 避免噪音压过整体
      noiseToMasterRatio: noiseTargetGain / this.volume,
    });

    // 低通滤波器 · pad 音色塑形
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(synth.filterFreq, now);
    filter.Q.value = 1.2;
    filter.connect(masterGain);

    // LFO · 调制 filter.frequency 制造呼吸感
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    // 能量越高 LFO 越快 · climax 阶段呼吸更急促
    const lfoFreq = LFO_BASE_FREQ + energy * 0.3;
    lfo.frequency.setValueAtTime(lfoFreq, now);
    const lfoGain = ctx.createGain();
    // reverb 越大调制越深 · 呼吸幅度更明显
    const lfoDepth = synth.filterFreq * (0.3 + synth.reverb * 0.4);
    lfoGain.gain.setValueAtTime(lfoDepth, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // ── KEY 时序 · LFO 调制启动 · 排查呼吸调制与节拍的对齐 ──
    this.logKeyPhase('lfo:started', {
      startAt: now,
      type: 'sine',
      lfoFreq,
      lfoDepth,
      modulates: 'filter.frequency',
      filterBaseFreq: synth.filterFreq,
      filterQ: 1.2,
      chain: 'lfo→lfoGain→filter.frequency',
    });

    // 主垫振荡器 · 根音 + 五度 · 音量压低至 0.15 仅作和声底
    const padOscs: OscillatorNode[] = [];
    const rootFreq = synth.rootFreq;
    const intervals = [1, 1.5]; // 根音 + 纯五度
    const padGainValue = 0.15;
    intervals.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      osc.type = synth.timbre;
      osc.frequency.setValueAtTime(rootFreq * ratio, now);
      // 弱微调频 · 模拟模拟音色的不稳定性
      const detuneCents = (Math.random() - 0.5) * 6;
      osc.detune.setValueAtTime(detuneCents, now);
      const padGain = ctx.createGain();
      // 压低 pad 音量 · 让白噪音成为主导底音 · 避免 sawtooth 高频刺耳
      padGain.gain.setValueAtTime(padGainValue, now);
      osc.connect(padGain);
      padGain.connect(filter);
      osc.start();
      padOscs.push(osc);

      // ── KEY 时序 · pad 振荡器启动 · 监控 sawtooth 高频与噪音的对齐 ──
      this.logKeyPhase(`pad:started#${idx}`, {
        startAt: now,
        timbre: synth.timbre,
        freq: rootFreq * ratio,
        ratio,
        detuneCents: +detuneCents.toFixed(2),
        gain: padGainValue,
        chain: 'osc→padGain→filter→masterGain',
      });
    });

    // ── pad 参数 logger · climax 阶段 sawtooth 易刺耳 · 监控音量占比 ──
    this.logSynth('pad:built', {
      phase: track.phase,
      timbre: synth.timbre,
      rootFreq,
      intervals,
      actualFreqs: intervals.map((r) => rootFreq * r),
      padGainValue,
      lfoFreq: LFO_BASE_FREQ + energy * 0.3,
      lfoDepth: synth.filterFreq * (0.3 + synth.reverb * 0.4),
      // pad 总音量 = padGain × 2 个振荡器 · 与噪音对比
      padTotalGain: padGainValue * intervals.length,
      noiseToPadRatio: noiseTargetGain / (padGainValue * intervals.length),
    });

    // 节拍 · 仅 energy > 0.4 的阶段启用（rising/climax）
    let beatOsc: OscillatorNode | null = null;
    let beatGain: GainNode | null = null;
    let beatTimer: number | null = null;
    if (energy > 0.4) {
      beatOsc = ctx.createOscillator();
      beatOsc.type = 'sine';
      // 节拍音高 = 根音 × 2（高八度，更清脆）
      beatOsc.frequency.setValueAtTime(rootFreq * 2, now);
      beatGain = ctx.createGain();
      // 节拍音量基线 · 静音，由定时器触发包络脉冲
      beatGain.gain.setValueAtTime(0, now);
      beatOsc.connect(beatGain);
      beatGain.connect(masterGain);
      beatOsc.start();

      // 按 BPM 触发节拍脉冲 · 60/BPM = 每拍秒数
      const beatIntervalMs = (60 / bpm) * 1000;
      const beatAmp = Math.min(0.35, energy * 0.4);
      // 节拍脉冲计数 · 用于 KEY 时序日志追踪每拍触发的对齐
      let beatPulseCount = 0;
      const triggerBeat = () => {
        if (!this.ctx || !beatGain) return;
        const t = this.ctx.currentTime;
        beatGain.gain.cancelScheduledValues(t);
        beatGain.gain.setValueAtTime(0, t);
        beatGain.gain.linearRampToValueAtTime(beatAmp, t + 0.008);
        beatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        beatPulseCount++;
        // ── KEY 时序 · 每拍脉冲触发 · 排查节拍与 LFO/淡入的对齐 ──
        this.logKeyPhase('beat:pulse', {
          pulseIdx: beatPulseCount,
          triggerAt: t,
          attackEndAt: t + 0.008,
          releaseEndAt: t + 0.18,
          amp: beatAmp,
        });
      };
      // 递归节拍 · 每次把最新 timer ID 写回 this.nodes.beatTimer
      // 并检查 this.nodes 是否仍存在 · 切换/停止时 this.nodes=null 终止递归
      // 避免旧闭包 beatTimer 覆盖问题导致 timer 永不被清理
      const scheduleBeat = () => {
        if (!this.nodes) return; // 已停止/已切换 · 终止递归
        triggerBeat();
        this.nodes.beatTimer = window.setTimeout(scheduleBeat, beatIntervalMs);
      };
      // 首拍稍延迟 · 避免与淡入重叠
      beatTimer = window.setTimeout(scheduleBeat, beatIntervalMs);

      // ── KEY 时序 · 节拍振荡器启动 · climax 阶段核心排查点 ──
      this.logKeyPhase('beat:started', {
        startAt: now,
        timbre: 'sine',
        freq: rootFreq * 2,
        gainBaseline: 0,
        chain: 'beatOsc→beatGain→masterGain',
        firstBeatDelayMs: beatIntervalMs,
        firstBeatScheduledAt: now + beatIntervalMs / 1000,
        bpm,
        beatIntervalMs,
        beatAmp,
        attackMs: 8,
        releaseMs: 180,
      });

      // ── 节拍 logger · climax 阶段节拍脉冲最易感知音量突变 ──
      this.logSynth('beat:built', {
        phase: track.phase,
        bpm,
        beatIntervalMs,
        beatAmp,
        beatFreq: rootFreq * 2,
        attackMs: 8,
        releaseMs: 180,
        firstBeatDelayMs: beatIntervalMs,
      });
    }

    this.nodes = {
      padOscs,
      beatOsc,
      filter,
      lfo,
      lfoGain,
      masterGain,
      beatGain: beatGain ?? ctx.createGain(),
      beatTimer,
      noiseSource,
      noiseFilter,
      noiseGain,
    };

    // ── 增益链总结 logger · opening/climax 输出完整链路便于排查 ──
    this.logSynth('buildNodes:complete', {
      phase: track.phase,
      isKeyPhase: track.phase === 'opening' || track.phase === 'climax',
      gainChain: {
        master: this.volume,
        noise: noiseTargetGain,
        padPerOsc: padGainValue,
        padTotal: padGainValue * intervals.length,
        beat: energy > 0.4 ? Math.min(0.35, energy * 0.4) : 0,
      },
      // 总输出估算 · noise + padTotal + beat · 应 ≤ master 避免削波
      estimatedTotal:
        noiseTargetGain + padGainValue * intervals.length + (energy > 0.4 ? Math.min(0.35, energy * 0.4) : 0),
      masterVolume: this.volume,
      mayClip:
        noiseTargetGain + padGainValue * intervals.length + (energy > 0.4 ? Math.min(0.35, energy * 0.4) : 0) >
        this.volume,
    });
  }

  /** 淡出并停止所有活跃节点 · 过渡或停止时调用 */
  private fadeOutAndStopNodes(): void {
    const ctx = this.ctx;
    const nodes = this.nodes;
    if (!ctx || !nodes) return;

    // ── KEY 时序 · 淡出起点 · 排查阶段切换时各节点的停止对齐 ──
    this.logKeyPhase('fadeOut:keyStart', {
      fadeStartAt: ctx.currentTime,
      fadeEndAt: ctx.currentTime + FADE_MS / 1000,
      hadBeat: nodes.beatOsc !== null,
      masterGainValue: nodes.masterGain.gain.value,
      padOscCount: nodes.padOscs.length,
    });

    // ── 淡出 logger · 排查切换时音量突变 · 打印淡出起点增益 ──
    this.logSynth('fadeOut:start', {
      trackId: this.currentTrack?.id,
      phase: this.currentTrack?.phase,
      currentMasterGain: nodes.masterGain.gain.value,
      fadeSec: FADE_MS / 1000,
      hadBeat: nodes.beatOsc !== null,
    });

    // 清理节拍定时器
    if (nodes.beatTimer !== null) {
      clearTimeout(nodes.beatTimer);
      nodes.beatTimer = null;
    }

    // 主增益淡出至 0 · 然后停止所有振荡器
    const now = ctx.currentTime;
    const fadeSec = FADE_MS / 1000;
    nodes.masterGain.gain.cancelScheduledValues(now);
    nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
    nodes.masterGain.gain.linearRampToValueAtTime(0, now + fadeSec);

    // 淡出完成后清理 · 留出时间让包络完成
    const cleanupDelay = (fadeSec + 0.1) * 1000;
    setTimeout(() => {
      try {
        nodes.padOscs.forEach((osc) => osc.stop());
        if (nodes.beatOsc) nodes.beatOsc.stop();
        nodes.lfo.stop();
        nodes.noiseSource.stop();
        nodes.padOscs.forEach((osc) => osc.disconnect());
        if (nodes.beatOsc) nodes.beatOsc.disconnect();
        nodes.filter.disconnect();
        nodes.lfo.disconnect();
        nodes.lfoGain.disconnect();
        nodes.masterGain.disconnect();
        nodes.beatGain.disconnect();
        nodes.noiseSource.disconnect();
        nodes.noiseFilter.disconnect();
        nodes.noiseGain.disconnect();
      } catch {
        /* 节点已清理 · 静默 */
      }
    }, cleanupDelay);

    this.nodes = null;
  }
}

/** 全局单例 · 跨组件共享同一 AudioContext */
export const musicEngine = new MusicEngine();

export type { MusicTrack };
