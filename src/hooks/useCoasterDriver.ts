/**
 * useCoasterDriver · 杯垫硬件协议 React 适配层
 *
 * 管理硬件驱动生命周期：
 *   - 挂载时创建驱动、订阅遥测、启动物理推进
 *   - 卸载时停止推进、取消订阅
 *   - 风扇目标 / 加热开关变化时即时下发
 *
 * 返回实时遥测 · 上层据此渲染响应曲线与硬件状态
 *
 * 与硬件解耦：上层只关心 fanTarget / heating，不感知驱动实现
 */

import { useEffect, useRef, useState } from 'react';
import {
  createCoasterDriver,
  type CoasterProtocol,
  type CoasterTelemetry,
} from '../hardware/coasterProtocol';

export interface UseCoasterDriverResult {
  /** 实时遥测 · 未收到首帧前为 null */
  telemetry: CoasterTelemetry | null;
}

export function useCoasterDriver(
  fanTarget: number,
  heating: boolean,
): UseCoasterDriverResult {
  const [telemetry, setTelemetry] = useState<CoasterTelemetry | null>(null);
  const driverRef = useRef<CoasterProtocol | null>(null);

  // 挂载时创建驱动 · 卸载时清理
  useEffect(() => {
    const driver = createCoasterDriver();
    driverRef.current = driver;
    const unsub = driver.onTelemetry((t) => setTelemetry(t));
    driver.start();
    // 立即下发一次初始目标，避免首帧空转
    return () => {
      unsub();
      driver.stop();
      driverRef.current = null;
    };
  }, []);

  // 风扇目标变化 · 即时下发
  useEffect(() => {
    driverRef.current?.setFanSpeed(fanTarget);
  }, [fanTarget]);

  // 加热开关变化 · 即时下发
  useEffect(() => {
    driverRef.current?.setHeating(heating);
  }, [heating]);

  return { telemetry };
}
