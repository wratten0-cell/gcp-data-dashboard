import React from 'react';
import { EChartCard } from '../dashboard/EChartCard';
import { TrendingUp, Target, ShieldCheck, Zap } from 'lucide-react';

export function ForecastView({ result }) {
  if (!result || !result.chart_data) return null;

  const dates = result.chart_data.map(d => d.forecast_date);
  const predictions = result.chart_data.map(d => d.prediction);
  const upperBounds = result.chart_data.map(d => d.upper_bound_95);
  const lowerBounds = result.chart_data.map(d => d.lower_bound_95);

  const forecastOption = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        let date = params[0].name;
        let pred = params.find(p => p.seriesName === 'Predicted Revenue')?.value || 0;
        let upper = params.find(p => p.seriesName === 'Upper Bound (95%)')?.value || 0;
        let lower = params.find(p => p.seriesName === 'Lower Bound (95%)')?.value || 0;
        return `<strong>${date}</strong><br/>
                <span style="color:#3b82f6">●</span> Forecast: <strong>$${pred.toLocaleString()}</strong><br/>
                <span style="color:#93c5fd">●</span> 95% Upper: $${upper.toLocaleString()}<br/>
                <span style="color:#93c5fd">●</span> 95% Lower: $${lower.toLocaleString()}`;
      }
    },
    legend: {
      data: ['Predicted Revenue', '95% Confidence Band', 'Trend Component'],
      top: 0
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '${value}' }
    },
    series: [
      {
        name: 'Predicted Revenue',
        type: 'line',
        data: predictions,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 3 },
        markPoint: {
          data: [
            { type: 'max', name: 'Max Forecast' },
            { type: 'min', name: 'Min Forecast' }
          ]
        }
      },
      {
        name: 'Upper Bound (95%)',
        type: 'line',
        data: upperBounds,
        lineStyle: { opacity: 0 },
        stack: 'confidence-band',
        symbol: 'none'
      },
      {
        name: '95% Confidence Band',
        type: 'line',
        data: lowerBounds,
        lineStyle: { opacity: 0 },
        areaStyle: { color: 'rgba(59, 130, 246, 0.15)' },
        stack: 'confidence-band',
        symbol: 'none'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Model Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 block mb-1">Projected 30-Day Revenue</span>
          <h3 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            ${result.summary?.projected_total?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 block mb-1">Mean Daily Run-Rate</span>
          <h3 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            ${result.summary?.mean_daily_forecast?.toLocaleString()}
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 block mb-1">Forecasted Growth</span>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {result.summary?.growth_rate_pct}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              Positive Trend
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs text-zinc-500 block mb-1">Model Uncertainty</span>
          <h3 className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {result.summary?.uncertainty_spread}
          </h3>
        </div>
      </div>

      {/* Main ECharts Forecast Visualizer */}
      <EChartCard
        title="BigQuery ML ARIMA_PLUS / AI.FORECAST Projection"
        description={`Displaying ${result.horizon_days}-day forward horizon with 95% confidence envelope`}
        option={forecastOption}
        sql={`SELECT * FROM ML.FORECAST(MODEL \`${result.model_id}\`, STRUCT(${result.horizon_days} AS horizon, ${result.confidence_level} AS confidence_level));`}
        height={400}
      />
    </div>
  );
}
