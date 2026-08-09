/**
 * vitest 全局 setup
 * - 注入 @testing-library/jest-dom 断言（toBeInTheDocument 等）
 * - mock AudioContext：jsdom 无原生实现，musicEngine 依赖需完整 stub
 * - 每个测试间清理存储，避免状态串扰
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

/**
 * 可链式调用的增益节点 mock
 * musicEngine 依赖：gain.value / setValueAtTime / linearRampToValueAtTime /
 *   cancelScheduledValues / setTargetAtTime / connect
 */
function createGainMock() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      setTargetAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

/** 振荡器节点 mock · 频率/解谐/类型/start/stop/connect */
function createOscillatorMock() {
  return {
    frequency: { setValueAtTime: vi.fn() },
    detune: { setValueAtTime: vi.fn() },
    type: 'sine',
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

/** 双二阶滤波器 mock · 类型/频率/Q/connect */
function createBiquadFilterMock() {
  return {
    type: 'lowpass',
    frequency: {
      value: 1000,
      setValueAtTime: vi.fn(),
      connect: vi.fn(),
    },
    Q: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

/** 音频 buffer mock · 含 getChannelData 返回 Float32Array · 用于白噪音生成 */
function createAudioBufferMock(length: number, sampleRate: number) {
  const data = new Float32Array(length);
  return {
    length,
    sampleRate,
    duration: length / sampleRate,
    numberOfChannels: 1,
    getChannelData: vi.fn(() => data),
  };
}

/** buffer source 节点 mock · buffer/loop/start/stop/connect · 用于白噪音循环播放 */
function createBufferSourceMock() {
  return {
    buffer: null as unknown,
    loop: false,
    playbackRate: { value: 1, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

/**
 * AudioContext mock · 覆盖 musicEngine 用到的全部 API
 * - state/resume：模拟自动播放策略
 * - currentTime：固定 0，调度方法不报错
 * - create*：返回对应 mock 节点
 * - createBuffer/createBufferSource：白噪音柔和化路径所需
 */
class AudioContextMock {
  state: AudioContextState = 'running';
  currentTime = 0;
  destination = { connect: vi.fn() };

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  createGain() {
    return createGainMock();
  }

  createOscillator() {
    return createOscillatorMock();
  }

  createBiquadFilter() {
    return createBiquadFilterMock();
  }

  createBuffer(_channels: number, length: number, sampleRate: number) {
    return createAudioBufferMock(length, sampleRate);
  }

  createBufferSource() {
    return createBufferSourceMock();
  }
}

// 注入全局 AudioContext · jsdom 无原生实现
globalThis.AudioContext = AudioContextMock as unknown as typeof AudioContext;
// webkit 前缀兼容
(globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext =
  AudioContextMock as unknown as typeof AudioContext;

// matchMedia mock · 部分 UI 库依赖
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

// 每个测试后清理 localStorage / sessionStorage · 避免画像/情绪态串扰
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
