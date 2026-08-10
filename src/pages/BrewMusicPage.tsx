/**
 * BrewMusicPage · 酿·乐 · 音乐控件独立展示页
 *
 * 展示四梯度歌单切换 + 旅程音乐控制
 * 由 musicEngine 程序化合成白噪音底 · 零音频文件
 */

import { Link } from 'react-router-dom';
import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useJourney } from '../hooks/useJourney';
import GlassPanel from '../components/ui/GlassPanel';
import MusicControl from '../components/brew/music/MusicControl';
import PlaylistSelector from '../components/brew/music/PlaylistSelector';
import SevenDimensionalRadar, {
  type RadarDimension,
} from '../components/brew/music/SevenDimensionalRadar';
import CustomAudioPlayer from '../components/brew/music/CustomAudioPlayer';
import type { AudioAnalysis } from '../engine/audioAnalyzer';

const LOG_PREFIX = '[BrewMusicPage]';
let radarSwitchCount = 0;

export default function BrewMusicPage() {
  const {
    audioEnabled,
    musicVolume,
    setAudioEnabled,
    setMusicVolume,
    profile,
    vector,
    activeMood,
    moodIntensity,
  } = useAppStore();

  const { journeyState, currentTrack, isPlaying, currentTier, onTierChange } = useJourney();

  /** 实时音频分析数据 · 反哺雷达图 */
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const handleAudioAnalysis = useCallback((analysis: AudioAnalysis) => {
    setAudioAnalysis((prev) => {
      if (!prev) {
        radarSwitchCount++;
        console.debug(
          `${LOG_PREFIX}:radarSwitch`,
          JSON.stringify({
            switch: radarSwitchCount,
            from: 'derived',
            to: 'realtime-audio',
            bass: analysis.bassEnergy.toFixed(3),
            mid: analysis.midEnergy.toFixed(3),
            rms: analysis.loudness.toFixed(3),
            bpm: analysis.rawBpm,
            timestamp: new Date().toISOString(),
          }),
        );
      }
      return analysis;
    });
  }, []);

  /** 七维向量 · 优先使用音频分析数据，无上传音乐时回退派生值 */
  const musicDimensions: RadarDimension[] = useMemo(() => {
    // 有实时音频分析 → 用真实声学指纹
    if (audioAnalysis) {
      return [
        { key: 'I', label: 'I 低频', color: '#93c5fd', value: audioAnalysis.bassEnergy },
        { key: 'P', label: 'P 中频', color: '#c4b5fd', value: audioAnalysis.midEnergy },
        { key: 'D', label: 'D 高频', color: '#fdba74', value: audioAnalysis.trebleEnergy },
        { key: 'S', label: 'S 响度', color: '#fde68a', value: audioAnalysis.loudness },
        { key: 'DevI', label: 'Dev-I', color: '#f9a8d4', value: audioAnalysis.spectralCentroid },
        { key: 'Dev1', label: 'Dev1', color: '#6ee7b7', value: audioAnalysis.peakEnergy },
        { key: 'Dev2', label: 'Dev2', color: '#67e8f9', value: audioAnalysis.estimatedBpm },
      ];
    }

    // 无上传音乐 → 回退派生值
    const meta = journeyState.meta;
    const synth = currentTrack.synth;

    let personalityAltitude = 0.5;
    if (vector) {
      const vals = Object.values(vector) as number[];
      personalityAltitude = vals.reduce((s, v) => s + v, 0) / vals.length;
    } else if (profile) {
      const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = profile.scores;
      personalityAltitude = (openness + conscientiousness + extraversion + agreeableness + (100 - neuroticism)) / 500;
    }

    return [
      { key: 'I', label: 'I 海拔', color: '#93c5fd', value: personalityAltitude },
      { key: 'P', label: 'P 坡度', color: '#c4b5fd', value: activeMood ? moodIntensity : 0.02 },
      { key: 'D', label: 'D 阻尼', color: '#fdba74', value: meta.energy },
      { key: 'S', label: 'S 熵', color: '#fde68a', value: Math.min(1, meta.bpm / 160) },
      {
        key: 'DevI', label: 'Dev-I', color: '#f9a8d4',
        value: activeMood ? currentTrack.moodAffinity.includes(activeMood) ? 0.72 : 0.35 : 0.5,
      },
      { key: 'Dev1', label: 'Dev1', color: '#6ee7b7', value: synth.reverb },
      { key: 'Dev2', label: 'Dev2', color: '#67e8f9', value: Math.min(1, synth.filterFreq / 4000) },
    ];
  }, [journeyState, currentTrack, profile, vector, activeMood, moodIntensity, audioAnalysis]);

  return (
    <div className="animate-fade-in min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 标题区 */}
      <header className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3">
              酿 · 乐 · Music Engine
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
              旅程音乐
            </h1>
          </div>
          <Link
            to="/cocktail"
            className="text-xs text-amethyst-300/70 hover:text-amethyst-200 transition-colors tracking-[0.1em]"
          >
            ← 返回调酒
          </Link>
        </div>
        <p className="text-sm text-moon-200/60 italic max-w-xl">
          程序化合成的白噪音底 · 四梯度歌单与情绪旅程联动 · 接入网易云后触发外链播放。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 音乐控件 */}
      <MusicControl
        track={currentTrack}
        isPlaying={isPlaying}
        volume={musicVolume}
        onTogglePlay={() => setAudioEnabled(!audioEnabled)}
        onVolumeChange={setMusicVolume}
      />

      {/* 四梯度歌单 */}
      <PlaylistSelector
        currentTier={currentTier}
        onTierChange={onTierChange}
      />

      {/* 当前阶段说明 */}
      <GlassPanel padding="md">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
            当前旅程阶段
          </h2>
          <span
            className="text-xs tracking-[0.15em] font-display transition-colors duration-500"
            style={{ color: journeyState.meta.color }}
          >
            {journeyState.meta.symbol} · {journeyState.meta.label}
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-1">BPM</div>
            <div className="font-mono text-moon-50">{journeyState.meta.bpm}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-1">音乐风格</div>
            <div className="text-moon-50/80">{journeyState.meta.musicStyle}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-1">合成参数</div>
            <div className="text-xs text-moon-200/55 font-mono">
              {currentTrack.synth.rootFreq}Hz · {currentTrack.synth.timbre}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amethyst-500/15">
          <p className="text-xs text-moon-200/50 italic" style={{ color: journeyState.meta.color }}>
            {journeyState.meta.poem}
          </p>
        </div>
      </GlassPanel>

      {/* 七维雷达图 · 音乐向量空间可视化 */}
      <section className="mb-10">
        <GlassPanel gold padding="lg">
          <div className="flex items-center justify-center gap-3 mb-1">
            <SevenDimensionalRadar
              dimensions={musicDimensions}
              size={320}
              title={audioAnalysis ? '七维向量 · 实时音频分析' : '七维向量 · 派生数据'}
            />
          </div>
          {audioAnalysis && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-400/70 tracking-[0.1em]">
                实时音频分析 · 声学指纹反哺中
              </span>
              {audioAnalysis.rawBpm > 0 && (
                <span className="text-[9px] text-gold-400/60 font-mono ml-2">
                  BPM {audioAnalysis.rawBpm}
                </span>
              )}
            </div>
          )}
        </GlassPanel>
      </section>

      {/* 定制曲目 · 上传播放专属音频 */}
      <section className="mb-10">
        <CustomAudioPlayer onAnalysis={handleAudioAnalysis} />
      </section>

      <div className="h-16" />
    </div>
  );
}