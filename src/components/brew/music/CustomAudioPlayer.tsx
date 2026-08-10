/**
 * CustomAudioPlayer · 通用音频上传播放器
 *
 * 功能：
 *   - 拖拽 / 点击上传 MP3/WAV/OGG
 *   - 播放/暂停/快进快退
 *   - 进度条拖拽寻址 · 音量控制
 *   - 实时频谱波形（AnalyserNode 驱动）
 *   - BPM 检测显示
 *   - 音频分析数据回调 → 反哺七维雷达图
 *
 * Phase 1 通用建设 → Phase 2 酒款专属曲目关联
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import GlassPanel from '../../ui/GlassPanel';
import { audioAnalyzer, type AudioAnalysis } from '../../../engine/audioAnalyzer';

const LOG_PREFIX = '[CustomAudioPlayer]';
let analysisCallCount = 0;

interface AudioTrack {
  name: string;
  url: string;
  duration: number;
}

interface CustomAudioPlayerProps {
  /** 音频分析数据回调 · 反哺雷达图 */
  onAnalysis?: (analysis: AudioAnalysis) => void;
}

export default function CustomAudioPlayer({ onAnalysis }: CustomAudioPlayerProps) {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isDragOver, setIsDragOver] = useState(false);
  const [detectedBpm, setDetectedBpm] = useState(0);
  const [freqBars, setFreqBars] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);

  /** 加载音频文件 */
  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('audio/')) {
        console.warn(`${LOG_PREFIX}:loadFile`, `rejected non-audio file: ${file.type}`);
        return;
      }

      console.debug(
        `${LOG_PREFIX}:loadFile`,
        JSON.stringify({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)}KB`,
          type: file.type,
          timestamp: new Date().toISOString(),
        }),
      );

      if (track?.url) URL.revokeObjectURL(track.url);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      audioAnalyzer.disconnect();

      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^.]+$/, '');
      setTrack({ name, url, duration: 0 });
      setIsPlaying(false);
      setCurrentTime(0);
      setDetectedBpm(0);
      setFreqBars([]);
    },
    [track],
  );

  /** 时间更新 */
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  }, []);

  /** 元数据加载后接入分析器 */
  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    setDuration(dur);
    setTrack((prev) =>
      prev ? { ...prev, duration: audioRef.current!.duration } : null,
    );

    console.debug(
      `${LOG_PREFIX}:metadata`,
      JSON.stringify({
        duration: dur.toFixed(1) + 's',
        readyState: audioRef.current.readyState,
        timestamp: new Date().toISOString(),
      }),
    );

    // 接入音频分析器
    const t0 = performance.now();
    audioAnalyzer.connect(audioRef.current, (analysis) => {
      analysisCallCount++;
      const bars: number[] = [];
      for (let i = 0; i < 32; i++) {
        const idx = Math.floor((i / 32) * analysis.frequencyData.length);
        bars.push(analysis.frequencyData[idx] / 255);
      }
      setFreqBars(bars);
      setDetectedBpm(analysis.rawBpm);

      // 每 60 次分析回调打印一次数据流
      if (analysisCallCount % 60 === 0) {
        console.debug(
          `${LOG_PREFIX}:analysis→parent`,
          JSON.stringify({
            call: analysisCallCount,
            bass: analysis.bassEnergy.toFixed(3),
            mid: analysis.midEnergy.toFixed(3),
            rms: analysis.loudness.toFixed(3),
            bpm: analysis.rawBpm,
            bars: bars.length,
            timestamp: new Date().toISOString(),
          }),
        );
      }

      onAnalysis?.(analysis);
    });
    const t1 = performance.now();
    console.debug(
      `${LOG_PREFIX}:analyzerConnected`,
      JSON.stringify({ connectMs: (t1 - t0).toFixed(1) + 'ms' }),
    );
  }, [onAnalysis]);

  /** 播放/暂停 */
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    const next = !isPlaying;
    if (next) {
      audioRef.current.play().catch((err) => {
        console.warn(`${LOG_PREFIX}:playError`, err.message);
      });
    } else {
      audioRef.current.pause();
    }
    console.debug(
      `${LOG_PREFIX}:${next ? 'play' : 'pause'}`,
      JSON.stringify({
        currentTime: audioRef.current.currentTime.toFixed(1),
        duration: audioRef.current.duration.toFixed(1),
        timestamp: new Date().toISOString(),
      }),
    );
    setIsPlaying(next);
  }, [isPlaying]);

  /** 进度条拖拽 */
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  /** 音量 */
  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (audioRef.current) audioRef.current.volume = v;
    setVolume(v);
  }, []);

  /** 快进/快退 */
  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds),
    );
  }, []);

  /** 拖拽上传 */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  /** 文件选择 */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  /** 移除曲目 */
  const removeTrack = useCallback(() => {
    console.debug(
      `${LOG_PREFIX}:removeTrack`,
      JSON.stringify({
        name: track?.name,
        analysisFrames: analysisCallCount,
        timestamp: new Date().toISOString(),
      }),
    );

    audioAnalyzer.disconnect();
    analysisCallCount = 0;
    if (track?.url) URL.revokeObjectURL(track.url);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDetectedBpm(0);
    setFreqBars([]);
    onAnalysis?.({
      bassEnergy: 0,
      midEnergy: 0,
      trebleEnergy: 0,
      loudness: 0,
      spectralCentroid: 0.5,
      peakEnergy: 0,
      estimatedBpm: 0.5,
      rawBpm: 0,
      frequencyData: new Uint8Array(128),
      timeData: new Uint8Array(128),
    });
  }, [track, onAnalysis]);

  /** 实时波形绘制 */
  useEffect(() => {
    if (!canvasRef.current || !track) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const barCount = freqBars.length || 32;
      const barWidth = w / barCount - 1;
      const centerY = h / 2;
      const played = duration > 0 ? currentTime / duration : 0;

      for (let i = 0; i < barCount; i++) {
        const progress = i / barCount;
        const amp = freqBars[i] || (Math.sin(progress * Math.PI * 3) * 0.3 + 0.3);
        const barHeight = amp * h * 0.8 + 2;
        const x = i * (barWidth + 1);

        ctx.fillStyle =
          progress <= played
            ? 'rgba(240,198,116,0.8)'
            : 'rgba(155,123,212,0.3)';
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [track, freqBars, currentTime, duration]);

  /** 监听播放结束 */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const ended = () => setIsPlaying(false);
    audio.addEventListener('ended', ended);
    return () => audio.removeEventListener('ended', ended);
  }, [track]);

  /** 格式化时间 */
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <GlassPanel gold padding="lg">
      <div className="space-y-4">
        {/* 标题 */}
        <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase text-center">
          定制曲目 · 上传你的专属音轨
        </div>

        {/* 上传区 */}
        {!track ? (
          <label
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragOver
                ? 'border-gold-400/50 bg-gold-400/5'
                : 'border-amethyst-500/20 hover:border-amethyst-400/40 hover:bg-amethyst-500/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-2xl mb-2 opacity-60">🎵</div>
            <div className="text-[11px] text-moon-200/50 tracking-[0.1em]">
              拖拽音频文件到此处，或点击选择
            </div>
            <div className="text-[9px] text-moon-200/30 mt-1">
              支持 MP3 / WAV / OGG
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            {/* 曲目信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-400/10 flex items-center justify-center text-gold-400/70 text-sm">
                  ♪
                </div>
                <div>
                  <div className="text-[12px] text-moon-100/90 tracking-[0.05em]">
                    {track.name}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-moon-200/40 font-mono">
                      {fmtTime(currentTime)} / {fmtTime(duration)}
                    </span>
                    {detectedBpm > 0 && (
                      <span className="text-[9px] text-gold-400/60 font-mono tracking-[0.05em]">
                        {detectedBpm} BPM
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={removeTrack}
                className="text-[9px] text-moon-200/30 hover:text-red-400/60 transition-colors tracking-[0.1em]"
              >
                移除
              </button>
            </div>

            {/* 实时频谱波形 */}
            <canvas
              ref={canvasRef}
              className="w-full h-12 rounded-lg"
              style={{ background: 'rgba(7,4,20,0.4)' }}
            />

            {/* 进度条 */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-moon-200/40 w-8 text-right">
                {fmtTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgba(240,198,116,0.6) ${(currentTime / (duration || 1)) * 100}%, rgba(155,123,212,0.15) ${(currentTime / (duration || 1)) * 100}%)`,
                  accentColor: '#f0c674',
                }}
              />
              <span className="text-[9px] font-mono text-moon-200/40 w-8">
                {fmtTime(duration)}
              </span>
            </div>

            {/* 控件区 */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => skip(-10)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-moon-200/50 hover:text-moon-100/80 transition-colors"
                title="快退 10 秒"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center hover:bg-gold-400/25 transition-all"
              >
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f0c674">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f0c674">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-moon-200/50 hover:text-moon-100/80 transition-colors"
                title="快进 10 秒"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>

            {/* 音量 */}
            <div className="flex items-center justify-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-moon-200/40">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolume}
                className="w-20 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: '#f0c674',
                  background: `linear-gradient(to right, rgba(240,198,116,0.5) ${volume * 100}%, rgba(155,123,212,0.15) ${volume * 100}%)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {track && (
        <audio
          ref={audioRef}
          src={track.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}
    </GlassPanel>
  );
}