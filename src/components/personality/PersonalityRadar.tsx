/**
 * PersonalityRadar · 五维人格雷达图
 * 以 ECharts 织一张星图，让 OCEAN 五维在夜色里显形
 * 紫金描边 · 金色辉光 · 紫色星点 · 透明底融入深空
 */

import { useEffect, useRef } from 'react';
// 按需引入 · 仅注册 radar + tooltip + canvas renderer · 大幅缩减 echarts 包体
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { PersonalityScores } from '../../types/personality';
import { PERSONALITY_TRAITS } from '../../data/personalityTraits';

echarts.use([RadarChart, TooltipComponent, CanvasRenderer]);

export interface PersonalityRadarProps {
  /** 五维分数 · 0-100 */
  scores: PersonalityScores;
}

/**
 * 构建 ECharts 配置 · 抽离为纯函数，便于分数更新时复用
 */
function buildOption(scores: PersonalityScores): echarts.EChartsCoreOption {
  return {
    backgroundColor: 'transparent',
    tooltip: { show: false },
    radar: {
      indicator: PERSONALITY_TRAITS.map((trait) => ({
        name: trait.label,
        max: 100,
      })),
      center: ['50%', '54%'],
      radius: '64%',
      axisName: {
        color: '#d8c9f5',
        fontSize: 13,
        fontFamily: '"Noto Serif SC", Georgia, serif',
        padding: [4, 6],
      },
      axisLine: {
        lineStyle: { color: 'rgba(155,123,212,0.2)' },
      },
      splitLine: {
        lineStyle: { color: 'rgba(155,123,212,0.2)' },
      },
      splitArea: { show: false },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          color: '#f0c674',
          width: 2,
        },
        areaStyle: {
          color: 'rgba(240,198,116,0.25)',
        },
        itemStyle: {
          color: '#9b7bd4',
          borderColor: '#f0c674',
          borderWidth: 1,
        },
        data: [
          {
            value: PERSONALITY_TRAITS.map((trait) => scores[trait.key]),
          },
        ],
      },
    ],
  };
}

export default function PersonalityRadar({ scores }: PersonalityRadarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // 挂载时初始化实例 · 卸载时销毁，避免内存泄漏
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // 分数变化时刷新配置 · 不重建实例
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(buildOption(scores));
  }, [scores]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: 320 }}
    />
  );
}
