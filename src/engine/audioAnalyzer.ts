/**
 * AudioAnalyzer · 音频分析引擎
 *
 * 从上传的音频文件中实时提取声学特征，反哺七维雷达图：
 *   - BPM 检测（峰值间隔法）
 *   - 频谱能量分布（低频/中频/高频 三带）
 *   - 整体响度（RMS）
 *   - 频谱质心（频率重心）
 *   - 波形峰值
 *
 * 无外部依赖 · 纯 Web Audio API
 *
 * 日志策略：
 *   - [AudioAnalyzer:connect]    每次连接时打印
 *   - [AudioAnalyzer:frame]      每 60 帧采样打印一次特征摘要
 *   - [AudioAnalyzer:bpm]        BPM 首次检测到 / 稳定收敛时打印
 *   - [AudioAnalyzer:tick]      每 120 帧打印一次帧率统计
 */

import { logger } from './logger';

/** 分析结果 · 七维向量映射 */
export interface AudioAnalysis {
  /** 低频能量 0-1 · 映射 I 海拔 */
  bassEnergy: number;
  /** 中频能量 0-1 · 映射 P 坡度 */
  midEnergy: number;
  /** 高频能量 0-1 · 映射 D 阻尼 */
  trebleEnergy: number;
  /** 整体响度 0-1 · 映射 S 熵 */
  loudness: number;
  /** 频谱质心归一化 0-1 · 映射 Dev-I */
  spectralCentroid: number;
  /** 峰值能量 0-1 · 映射 Dev1 */
  peakEnergy: number;
  /** 检测到的 BPM 归一化 · 映射 Dev2 */
  estimatedBpm: number;
  /** 原始 BPM 值（未归一化） */
  rawBpm: number;
  /** 频域数据（用于实时波形） */
  frequencyData: Uint8Array;
  /** 时域数据（用于波形） */
  timeData: Uint8Array;
}

/**
 * 音频分析器
 * 连接 AudioContext → AnalyserNode → 实时提取特征
 */
export class AudioAnalyzer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private animationId = 0;
  private onUpdate: ((analysis: AudioAnalysis) => void) | null = null;

  // BPM 检测用
  private beatHistory: number[] = [];
  private lastBeatTime = 0;
  private bpmSamples: number[] = [];
  private bpm: number = 0;
  private bpmLastLog = 0;

  // 帧率统计
  private frameCount = 0;
  private lastTickLog = 0;

  /** 连接音频元素 */
  connect(audio: HTMLAudioElement, callback: (analysis: AudioAnalysis) => void): void {
    this.disconnect();
    this.onUpdate = callback;

    const startTime = performance.now();
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = this.ctx.createMediaElementSource(audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.frameCount = 0;
    this.lastTickLog = 0;
    this.bpmLastLog = 0;

    const elapsed = (performance.now() - startTime).toFixed(1);
    logger.engine('AudioAnalyzer:connect', {
      sampleRate: this.ctx.sampleRate,
      fftSize: this.analyser.fftSize,
      binCount: this.analyser.frequencyBinCount,
      smoothingTimeConstant: this.analyser.smoothingTimeConstant,
      state: this.ctx.state,
      connectMs: `${elapsed}ms`,
      audioDuration: audio.duration?.toFixed(1) + 's',
    });

    this.startLoop();
  }

  /** 断开清理 */
  disconnect(): void {
    logger.engine('AudioAnalyzer:disconnect', {
      totalFrames: this.frameCount,
      finalBpm: Math.round(this.bpm),
      bpmSamples: this.bpmSamples.length,
    });

    this.stopLoop();
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.bpmSamples = [];
    this.bpm = 0;
  }

  /** 获取当前 BPM */
  getBpm(): number {
    return this.bpm;
  }

  /** 启动分析循环 */
  private startLoop(): void {
    if (!this.analyser || !this.ctx) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const tick = () => {
      if (!this.analyser) return;

      const t0 = performance.now();
      this.analyser.getByteFrequencyData(freqData);
      this.analyser.getByteTimeDomainData(timeData);
      const t1 = performance.now();

      const analysis = this.extractFeatures(freqData, timeData, bufferLength);
      const t2 = performance.now();

      this.onUpdate?.(analysis);

      this.frameCount++;

      // 每 60 帧打印特征摘要
      if (this.frameCount % 60 === 0) {
        logger.engine('AudioAnalyzer:frame', {
          frame: this.frameCount,
          bass: analysis.bassEnergy.toFixed(3),
          mid: analysis.midEnergy.toFixed(3),
          treble: analysis.trebleEnergy.toFixed(3),
          rms: analysis.loudness.toFixed(3),
          centroid: analysis.spectralCentroid.toFixed(3),
          peak: analysis.peakEnergy.toFixed(3),
          bpm: analysis.rawBpm,
          getDataMs: (t1 - t0).toFixed(2),
          extractMs: (t2 - t1).toFixed(2),
          totalMs: (t2 - t0).toFixed(2),
        });
      }

      // 每 120 帧打印帧率统计
      if (this.frameCount % 120 === 0) {
        const now = performance.now();
        if (this.lastTickLog > 0) {
          const elapsed = now - this.lastTickLog;
          const fps = (120 / (elapsed / 1000)).toFixed(1);
          logger.engine('AudioAnalyzer:tick', {
            frame: this.frameCount,
            fps,
            elapsedMs: elapsed.toFixed(0),
            targetFps: 60,
            drift: fps ? (Number(fps) < 55 ? 'SLOW' : 'OK') : 'N/A',
          });
        }
        this.lastTickLog = now;
      }

      this.animationId = requestAnimationFrame(tick);
    };

    this.animationId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  /** 从频域/时域数据提取特征 */
  private extractFeatures(
    freqData: Uint8Array,
    timeData: Uint8Array,
    bufferLength: number,
  ): AudioAnalysis {
    // 三带划分（bin 0~127 对应 0~22050Hz）
    const bassEnd = Math.floor(bufferLength * 0.1); // 0~2.2kHz
    const midEnd = Math.floor(bufferLength * 0.4); // 2.2~8.8kHz
    const trebleEnd = bufferLength; // 8.8~22kHz

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let totalSum = 0;
    let weightedSum = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = freqData[i] / 255;
      totalSum += v;
      weightedSum += v * i;

      if (i < bassEnd) bassSum += v;
      else if (i < midEnd) midSum += v;
      else trebleSum += v;
    }

    const bassCount = bassEnd;
    const midCount = midEnd - bassEnd;
    const trebleCount = trebleEnd - midEnd;

    const bassEnergy = bassSum / bassCount;
    const midEnergy = midSum / midCount;
    const trebleEnergy = trebleSum / trebleCount;

    // 频谱质心
    const centroid = totalSum > 0 ? weightedSum / totalSum / bufferLength : 0.5;

    // RMS 响度
    let rmsSum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      rmsSum += normalized * normalized;
    }
    const rms = Math.sqrt(rmsSum / timeData.length);

    // 峰值能量
    let peak = 0;
    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > peak) peak = freqData[i];
    }
    const peakEnergy = peak / 255;

    // BPM 检测（简易峰值检测）
    const now = performance.now();
    const currentLoudness = bassEnergy + midEnergy * 0.5;
    if (currentLoudness > 0.15 && now - this.lastBeatTime > 200) {
      this.lastBeatTime = now;
      this.beatHistory.push(now);
      if (this.beatHistory.length > 8) this.beatHistory.shift();

      if (this.beatHistory.length >= 4) {
        let intervals = 0;
        let totalInterval = 0;
        for (let i = 1; i < this.beatHistory.length; i++) {
          totalInterval += this.beatHistory[i] - this.beatHistory[i - 1];
          intervals++;
        }
        if (intervals > 0) {
          const avgInterval = totalInterval / intervals;
          const detectedBpm = 60000 / avgInterval;
          if (detectedBpm > 40 && detectedBpm < 220) {
            this.bpmSamples.push(detectedBpm);
            if (this.bpmSamples.length > 20) this.bpmSamples.shift();
            const prevBpm = Math.round(this.bpm);
            this.bpm = this.bpmSamples.reduce((a, b) => a + b, 0) / this.bpmSamples.length;
            const newBpm = Math.round(this.bpm);

            // BPM 首次检测到 或 收敛到稳定值 时打印
            if (
              (prevBpm === 0 && newBpm > 0) ||
              (Math.abs(newBpm - prevBpm) > 5 && this.bpmSamples.length >= 8)
            ) {
              const now2 = performance.now();
              if (now2 - this.bpmLastLog > 2000) {
                this.bpmLastLog = now2;
                logger.engine('AudioAnalyzer:bpm', {
                  detected: newBpm,
                  prev: prevBpm,
                  samples: this.bpmSamples.length,
                  raw: this.bpmSamples.map((s) => Math.round(s)).slice(-8),
                  beatCount: this.beatHistory.length,
                });
              }
            }
          }
        }
      }
    }

    const estimatedBpm = this.bpm > 0 ? Math.min(1, this.bpm / 160) : 0.5;

    return {
      bassEnergy,
      midEnergy,
      trebleEnergy,
      loudness: rms,
      spectralCentroid: centroid,
      peakEnergy,
      estimatedBpm,
      rawBpm: Math.round(this.bpm),
      frequencyData: freqData.slice(),
      timeData: timeData.slice(),
    };
  }
}

/** 单例 */
export const audioAnalyzer = new AudioAnalyzer();