import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Code, Check, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function EChartCard({ title, description, option, sql, height = 360, className = "" }) {
  const { theme } = useTheme();
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isDark = theme === 'dark';

  // Base Chart Options with Theme Styling
  const themedOption = {
    ...option,
    backgroundColor: 'transparent',
    color: option?.color || [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', 
      '#f97316', '#6366f1'
    ],
    textStyle: {
      fontFamily: '"DM Sans", system-ui, sans-serif',
      color: isDark ? '#a1a1aa' : '#52525b',
    },
    tooltip: {
      backgroundColor: isDark ? '#18181b' : '#ffffff',
      borderColor: isDark ? '#27272a' : '#e4e4e7',
      borderWidth: 1,
      textStyle: {
        color: isDark ? '#f4f4f5' : '#09090b',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
      },
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 8px;',
      ...option?.tooltip,
    },
    grid: {
      top: '15%',
      left: '3%',
      right: '4%',
      bottom: '5%',
      containLabel: true,
      ...option?.grid,
    },
    xAxis: Array.isArray(option?.xAxis) 
      ? option.xAxis.map(ax => ({
          ...ax,
          axisLine: { lineStyle: { color: isDark ? '#27272a' : '#e4e4e7' } },
          axisLabel: { color: isDark ? '#71717a' : '#71717a', fontSize: 11 },
          splitLine: { lineStyle: { color: isDark ? '#18181b' : '#f4f4f5' } }
        }))
      : option?.xAxis ? {
          ...option.xAxis,
          axisLine: { lineStyle: { color: isDark ? '#27272a' : '#e4e4e7' } },
          axisLabel: { color: isDark ? '#71717a' : '#71717a', fontSize: 11 },
          splitLine: { lineStyle: { color: isDark ? '#18181b' : '#f4f4f5' } }
        } : undefined,
    yAxis: Array.isArray(option?.yAxis)
      ? option.yAxis.map(ay => ({
          ...ay,
          axisLine: { lineStyle: { color: isDark ? '#27272a' : '#e4e4e7' } },
          axisLabel: { color: isDark ? '#71717a' : '#71717a', fontSize: 11 },
          splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f4f4f5' } }
        }))
      : option?.yAxis ? {
          ...option.yAxis,
          axisLine: { lineStyle: { color: isDark ? '#27272a' : '#e4e4e7' } },
          axisLabel: { color: isDark ? '#71717a' : '#71717a', fontSize: 11 },
          splitLine: { lineStyle: { color: isDark ? '#27272a' : '#f4f4f5' } }
        } : undefined,
  };

  const handleCopySql = () => {
    if (sql) {
      navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-200 ${
        isExpanded ? 'fixed inset-6 z-50 overflow-auto bg-white dark:bg-[#0c0c0f] p-6' : 'p-5'
      } ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h4 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {sql && (
            <button
              onClick={() => setShowSql(!showSql)}
              title="View BigQuery SQL"
              className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
                showSql
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Expand'}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Optional SQL Query Drawer */}
      {showSql && sql && (
        <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono relative">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5 pb-1 border-b border-zinc-800">
            <span>GOOGLE BIGQUERY SQL</span>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : null}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap text-emerald-400/90">{sql}</pre>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full">
        <ReactECharts
          option={themedOption}
          style={{ height: isExpanded ? 'calc(100vh - 160px)' : `${height}px`, width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
