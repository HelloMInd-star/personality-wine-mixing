"""
生成测试用 WAV 音频文件
- 120 BPM 低音节拍（kick drum 模拟）
- 440Hz 正弦波背景音（30% 音量）
- 时长 30 秒 · 44100Hz · 16-bit · 单声道
"""
import wave
import struct
import math
import os

SAMPLE_RATE = 44100
DURATION = 30  # 秒
BPM = 120
BEAT_INTERVAL = 60 / BPM  # 0.5 秒

# 输出路径
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "test_120bpm.wav")

total_samples = SAMPLE_RATE * DURATION
samples = []

for i in range(total_samples):
    t = i / SAMPLE_RATE

    # 440Hz 正弦波 · 30% 音量
    sine = 0.3 * math.sin(2 * math.pi * 440 * t)

    # 120 BPM 节拍 · 每 0.5 秒一个低音脉冲
    beat_pos = t % BEAT_INTERVAL
    # 短促信封：前 10ms 攻击 + 50ms 衰减
    if beat_pos < 0.06:
        if beat_pos < 0.01:
            env = beat_pos / 0.01
        else:
            env = max(0, 1 - (beat_pos - 0.01) / 0.05)
        # 80Hz 低音 + 谐波
        kick = env * (
            0.8 * math.sin(2 * math.pi * 80 * beat_pos) +
            0.4 * math.sin(2 * math.pi * 160 * beat_pos) +
            0.2 * math.sin(2 * math.pi * 240 * beat_pos)
        )
    else:
        kick = 0

    # 额外加一些高频沙沙声（模拟 hi-hat），每 0.25 秒
    hihat_pos = t % 0.25
    if hihat_pos < 0.02:
        hihat = (hihat_pos / 0.02) * 0.15 * (0.5 + 0.5 * math.sin(i * 0.01))
    else:
        hihat = 0

    sample = sine + kick + hihat
    # 限幅
    sample = max(-0.95, min(0.95, sample))
    samples.append(sample)

# 写入 WAV
with wave.open(OUTPUT_PATH, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)  # 16-bit
    wf.setframerate(SAMPLE_RATE)
    wf.setnframes(total_samples)

    for s in samples:
        wf.writeframes(struct.pack("<h", int(s * 32767)))

file_size = os.path.getsize(OUTPUT_PATH)
print(f"[OK] 测试音频已生成: {OUTPUT_PATH}")
print(f"     时长: {DURATION}s | BPM: {BPM} | 采样率: {SAMPLE_RATE}Hz | 大小: {file_size / 1024:.1f} KB")