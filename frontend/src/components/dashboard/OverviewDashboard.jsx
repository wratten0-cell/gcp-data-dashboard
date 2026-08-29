import React, { useState, useEffect } from 'react';
import { KPIGrid } from './KPIGrid';
import { EChartCard } from './EChartCard';
import { DataTable } from './DataTable';
import { DetailSidePanel } from './DetailSidePanel';
import { getDashboardSummary } from '../../services/api';
import { RotateCw, RefreshCw } from 'lucide-react';

export function OverviewDashboard() {
  const [summaryData, setSummaryData] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardSummary();
      setSummaryData(data);
    } catch (err) {
      console.warn('Could not load summary data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!summaryData) return null;

  // Chart 1: 90-Day Revenue & Transactions Dual-Axis Trend
  const dates = summaryData.daily_trends?.map(d => d.date) || [];
  const revenues = summaryData.daily_trends?.map(d => d.revenue) || [];
  const transactions = summaryData.daily_trends?.map(d => d.transactions) || [];

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        let d = params[0].name;
        let rev = params.find(p => p.seriesName === 'Daily Revenue')?.value || 0;
        let tx = params.find(p => p.seriesName === 'Transactions')?.value || 0;
        return `<strong>${d}</strong><br/>
                <span style="color:#3b82f6">●</span> Revenue: <strong>$${rev.toLocaleString()}</strong><br/>
                <span style="color:#10b981">●</span> Orders: <strong>${tx.toLocaleString()}</strong>`;
      }
    },
    legend: {
      data: ['Daily Revenue', 'Transactions'],
      top: 0
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: [
      {
        type: 'value',
        name: 'Revenue ($)',
        axisLabel: { formatter: '${value}' }
      },
      {
        type: 'value',
        name: 'Transactions',
        position: 'right',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Daily Revenue',
        type: 'line',
        data: revenues,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        areaStyle: { opacity: 0.15, color: '#3b82f6' },
        lineStyle: { width: 2.5 }
      },
      {
        name: 'Transactions',
        type: 'bar',
        yAxisIndex: 1,
        data: transactions,
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        barWidth: '35%'
      }
    ]
  };

  // Chart 2: Category Revenue Breakdown
  const categoryOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <strong>${c}</strong> ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%'
    },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#ffffff',
        borderWidth: 2
      },
      data: summaryData.category_breakdown?.map((cat, i) => {
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'];
        return {
          value: cat.value,
          name: cat.category,
          itemStyle: { color: colors[i % colors.length] }
        };
      }) || []
    }]
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <KPIGrid kpis={summaryData.kpis} />

      {/* Analytics Charts Gallery - Strict 1 Chart per row for primary, plus category donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EChartCard
            title="90-Day Enterprise Revenue & Order Volume"
            description="Daily aggregated transaction revenue with dual-axis volume breakdown"
            option={trendOption}
            sql="SELECT date, SUM(amount) as revenue, COUNT(id) as transactions FROM `analytics_production.daily_kpis` GROUP BY date ORDER BY date ASC;"
            height={360}
          />
        </div>

        <div className="lg:col-span-1">
          <EChartCard
            title="Product & Cloud Category Share"
            description="Proportion of revenue generated per service tier"
            option={categoryOption}
            sql="SELECT category, SUM(amount) as total_sales FROM `analytics_production.transactions` GROUP BY category;"
            height={360}
          />
        </div>
      </div>

      {/* Main Content Split: Table + Detail Side Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start transition-all duration-300">
        <div className={`transition-all duration-300 ${selectedRecord ? 'w-full lg:w-2/3' : 'w-full'}`}>
          <DataTable
            rows={summaryData.table_rows}
            selectedRow={selectedRecord}
            onSelectRow={(row) => setSelectedRecord(selectedRecord?.id === row.id ? null : row)}
            title="Active Enterprise Accounts & Risk Assessment"
          />
        </div>

        {selectedRecord && (
          <DetailSidePanel
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onApprove={(rec) => {
              alert(`Action approved for account: ${rec.customer}`);
              setSelectedRecord(null);
            }}
            onFlag={(rec) => {
              alert(`Account ${rec.customer} flagged for Customer Success review.`);
            }}
          />
        )}
      </div>

    </div>
  );
}
