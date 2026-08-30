import React, { useState, useEffect } from 'react';
import { KPIGrid } from './KPIGrid';
import { EChartCard } from './EChartCard';
import { DataTable } from './DataTable';
import { DetailSidePanel } from './DetailSidePanel';
import { getDashboardSummary } from '../../services/api';
import { RotateCw, Package, DollarSign, BarChart3, ScatterChart } from 'lucide-react';

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

  const pkgTypes = summaryData.packages_by_type?.map(p => p.package_type) || [
    'Standard Ground', 'Express Air', 'Overnight Priority', 'Freight Heavy', 'Same-Day Courier', 'International'
  ];
  const pkgCounts = summaryData.packages_by_type?.map(p => p.count) || [1420, 890, 620, 310, 480, 260];
  const pkgRevenues = summaryData.packages_by_type?.map(p => p.total_revenue) || [145200, 182400, 155000, 210800, 96000, 169000];

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
                <span style="color:#10b981">●</span> Total Revenue: <strong>$${rev.toLocaleString()}</strong>`;
      }
    },
    xAxis: {
      type: 'category',
      data: pkgTypes,
      axisLabel: { interval: 0, rotate: 15, fontSize: 11 }
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
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 11,
          color: '#71717a'
        },
        barWidth: '45%'
      }
    ]
  };

  // ---------------------------------------------------------------------------
  // 2. Dot Plot (Scatter Distribution) of Revenues by Package Type
  // ---------------------------------------------------------------------------
  // Dot plot points: [category_index_or_name, revenue, package_id, weight_kg, destination, status]
  const dotPoints = (summaryData.dot_plot_data || []).map(d => [
    d.package_type || 'Standard Ground',
    parseFloat(d.revenue || 0),
    d.package_id || d.id || 'PKG-1001',
    d.weight_kg || d.weight || 5.0,
    d.destination || d.region || 'US Domestic',
    d.status || 'Delivered'
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
                  <span>Weight: ${weight} kg</span><br/>
                  <span>Destination: ${dest}</span><br/>
                  <span>Status: <strong>${status}</strong></span>
                </div>`;
      }
    },
    xAxis: {
      type: 'category',
      data: pkgTypes,
      axisLabel: { interval: 0, rotate: 15, fontSize: 11 }
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
        symbolSize: function (val) {
          // Dynamic dot sizing based on weight
          const weight = val[3] || 5;
          return Math.min(26, Math.max(10, weight * 1.5));
        },
        data: dotPoints,
        itemStyle: {
          color: function (params) {
            const pType = params.value[0];
            const colorMap = {
              'Standard Ground': 'rgba(59, 130, 246, 0.75)',
              'Express Air': 'rgba(16, 185, 129, 0.75)',
              'Overnight Priority': 'rgba(245, 158, 11, 0.75)',
              'Freight Heavy': 'rgba(139, 92, 246, 0.75)',
              'Same-Day Courier': 'rgba(236, 72, 153, 0.75)',
              'International': 'rgba(6, 182, 212, 0.75)'
            };
            return colorMap[pType] || 'rgba(59, 130, 246, 0.75)';
          },
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 4,
          shadowColor: 'rgba(0, 0, 0, 0.15)'
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
      data: summaryData.packages_by_type?.map((p, i) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
        return {
          value: p.total_revenue,
          name: p.package_type,
          itemStyle: { color: colors[i % colors.length] }
        };
      }) || []
    }]
  };

  // Adapt table data format
  const tableData = (summaryData.table_rows || []).map(r => ({
    id: r.package_id || r.id,
    customer: `${r.destination || r.region || 'US'} (${r.package_type})`,
    segment: r.package_type,
    region: r.destination || r.region || 'US',
    amount: parseFloat(r.revenue || r.amount || 0),
    churn_risk_score: (r.revenue ? Math.min(1, r.revenue / 1000) : 0.2),
    status: r.status || 'Delivered',
    weight_kg: r.weight_kg || 5.0,
    timestamp: r.timestamp || '2026-08-29'
  }));

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row: Total Revenue, Total Packages, Avg Revenue */}
      <KPIGrid kpis={summaryData.kpis} />

      {/* Main Charts Row: Packages by Type & Revenue Dot Plot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Number of Packages by Type */}
        <EChartCard
          title="Number of Packages by Type"
          description="Total package volume grouped by shipping and logistics service tier"
          option={packagesByTypeOption}
          sql="SELECT package_type, COUNT(*) as count FROM `tribal-datum-507019-m0.uploadeddataset.packages` GROUP BY package_type ORDER BY count DESC;"
          height={360}
        />

        {/* Chart 2: Dot Plot of Revenues */}
        <EChartCard
          title="Revenue Dot Plot Distribution"
          description="Dot plot of individual package revenues across package categories"
          option={revenueDotPlotOption}
          sql="SELECT package_id, package_type, revenue, weight_kg, destination, status FROM `tribal-datum-507019-m0.uploadeddataset.packages` LIMIT 200;"
          height={360}
        />
      </div>

      {/* Secondary Chart: Total Revenue Share */}
      <div className="w-full">
        <EChartCard
          title="Total Revenue Share by Package Type"
          description="Cumulative revenue contribution per shipping category"
          option={revenueShareOption}
          sql="SELECT package_type, SUM(revenue) as total_revenue FROM `tribal-datum-507019-m0.uploadeddataset.packages` GROUP BY package_type;"
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
              alert(`Package ${rec.id} confirmed for priority dispatch.`);
              setSelectedRecord(null);
            }}
            onFlag={(rec) => {
              alert(`Package ${rec.id} flagged for logistics review.`);
            }}
          />
        )}
      </div>

    </div>
  );
}
