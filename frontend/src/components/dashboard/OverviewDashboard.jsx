import React, { useState, useEffect } from 'react';
import { KPIGrid } from './KPIGrid';
import { EChartCard } from './EChartCard';
import { DataTable } from './DataTable';
import { DetailSidePanel } from './DetailSidePanel';
import { getDashboardSummary } from '../../services/api';
import { RotateCw, Package, DollarSign, BarChart3 } from 'lucide-react';

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

  // Extract strictly the real package types present in the dataset
  const pkgTypes = summaryData.packages_by_type?.map(p => p.package_type) || [];
  const pkgCounts = summaryData.packages_by_type?.map(p => p.count) || [];
  const pkgRevenues = summaryData.packages_by_type?.map(p => p.total_revenue) || [];

  const themeColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // ---------------------------------------------------------------------------
  // 1. Number of Packages by Type (Bar Chart)
  // ---------------------------------------------------------------------------
  const packagesByTypeOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        const item = params[0];
        const rev = pkgRevenues[item.dataIndex] || 0;
        return `<strong>${item.name}</strong><br/>
                <span style="color:#3b82f6">●</span> Total Packages: <strong>${item.value.toLocaleString()}</strong><br/>
                <span style="color:#10b981">●</span> Total Revenue: <strong>$${Number(rev).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
      }
    },
    xAxis: {
      type: 'category',
      data: pkgTypes,
      axisLabel: { interval: 0, fontSize: 12, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      name: 'Package Count',
    },
    series: [
      {
        name: 'Packages Count',
        type: 'bar',
        data: pkgCounts,
        itemStyle: {
          color: function (params) {
            return themeColors[params.dataIndex % themeColors.length];
          },
          borderRadius: [8, 8, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#71717a'
        },
        barWidth: pkgTypes.length <= 2 ? '30%' : '45%'
      }
    ]
  };

  // ---------------------------------------------------------------------------
  // 2. Dot Plot (Scatter Distribution) of Revenues by Package Type
  // ---------------------------------------------------------------------------
  const dotPoints = (summaryData.dot_plot_data || []).map(d => [
    d.package_type,
    parseFloat(d.revenue || 0),
    d.package_id || d.id || 'PKG',
    d.weight_kg || d.weight || 5.0,
    d.destination || d.region || 'Domestic',
    d.status || 'Active'
  ]);

  const revenueDotPlotOption = {
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        const [pType, rev, pkgId, weight, dest, status] = params.value;
        return `<div style="font-family: 'DM Sans', sans-serif;">
                  <strong style="color:#3b82f6;">${pkgId}</strong> (${pType})<br/>
                  <hr style="border:0; border-top:1px solid #e4e4e7; margin:4px 0;" />
                  <span>Revenue: <strong>$${parseFloat(rev).toFixed(2)}</strong></span><br/>
                  ${dest ? `<span>Destination: ${dest}</span><br/>` : ''}
                  ${status ? `<span>Status: <strong>${status}</strong></span>` : ''}
                </div>`;
      }
    },
    xAxis: {
      type: 'category',
      data: pkgTypes,
      axisLabel: { interval: 0, fontSize: 12, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      name: 'Revenue ($)',
      axisLabel: { formatter: '${value}' }
    },
    series: [
      {
        name: 'Package Revenue Dot',
        type: 'scatter',
        symbolSize: 14,
        data: dotPoints,
        itemStyle: {
          color: function (params) {
            const pType = params.value[0];
            const typeIndex = pkgTypes.indexOf(pType);
            return themeColors[(typeIndex >= 0 ? typeIndex : 0) % themeColors.length];
          },
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 5,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      }
    ]
  };

  // ---------------------------------------------------------------------------
  // 3. Revenue Share by Package Type (Donut)
  // ---------------------------------------------------------------------------
  const revenueShareOption = {
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
      data: summaryData.packages_by_type?.map((p, i) => ({
        value: p.total_revenue,
        name: p.package_type,
        itemStyle: { color: themeColors[i % themeColors.length] }
      })) || []
    }]
  };

  // Prepare table records
  const tableData = (summaryData.table_rows || []).map((r, i) => ({
    id: r.package_id || r.id || `PKG-${i + 1}`,
    customer: `${r.destination || 'Hub'} (${r.package_type})`,
    segment: r.package_type,
    region: r.destination || r.region || 'US',
    amount: parseFloat(r.revenue || r.amount || 0),
    churn_risk_score: 0.25,
    status: r.status || 'Active',
    weight_kg: r.weight_kg || 5.0,
    timestamp: r.timestamp || '2026-08-29'
  }));

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row: Total Revenue, Total Packages, Avg Revenue */}
      <KPIGrid kpis={summaryData.kpis} />

      {/* Main Visualizations: Packages by Type & Revenue Dot Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Number of Packages by Type */}
        <EChartCard
          title="Number of Packages by Type"
          description={`Showing volume breakdown for the ${pkgTypes.length} package types in tribal-datum-507019-m0.uploadeddataset.packages`}
          option={packagesByTypeOption}
          sql="SELECT `Type`, COUNT(*) as count, ROUND(AVG(`Revenue`), 2) as avg_price, ROUND(SUM(`Revenue`), 2) as total_revenue FROM `tribal-datum-507019-m0.uploadeddataset.packages` GROUP BY `Type`;"
          height={360}
        />

        {/* Chart 2: Dot Plot of Revenues */}
        <EChartCard
          title="Revenue Dot Plot Distribution"
          description={`Individual package revenues plotted for ${pkgTypes.join(' vs ')}`}
          option={revenueDotPlotOption}
          sql="SELECT `Type`, `Revenue` FROM `tribal-datum-507019-m0.uploadeddataset.packages`;"
          height={360}
        />
      </div>

      {/* Secondary Chart: Total Revenue Share */}
      <div className="w-full">
        <EChartCard
          title="Total Revenue Share by Package Type"
          description="Revenue split between package categories"
          option={revenueShareOption}
          sql="SELECT `Type`, ROUND(SUM(`Revenue`), 2) as total_revenue FROM `tribal-datum-507019-m0.uploadeddataset.packages` GROUP BY `Type`;"
          height={340}
        />
      </div>

      {/* Packages Data Table with Row Deep Dive */}
      <div className="flex flex-col lg:flex-row gap-6 items-start transition-all duration-300">
        <div className={`transition-all duration-300 ${selectedRecord ? 'w-full lg:w-2/3' : 'w-full'}`}>
          <DataTable
            rows={tableData}
            selectedRow={selectedRecord}
            onSelectRow={(row) => setSelectedRecord(selectedRecord?.id === row.id ? null : row)}
            title="tribal-datum-507019-m0.uploadeddataset.packages — Package Records"
          />
        </div>

        {selectedRecord && (
          <DetailSidePanel
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onApprove={(rec) => {
              alert(`Package ${rec.id} confirmed.`);
              setSelectedRecord(null);
            }}
            onFlag={(rec) => {
              alert(`Package ${rec.id} flagged.`);
            }}
          />
        )}
      </div>

    </div>
  );
}
