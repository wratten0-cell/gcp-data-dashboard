import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { MLModelRunner } from './components/models/MLModelRunner';
import { DynamicDashboardView } from './components/generator/DynamicDashboardView';
import { DataExplorerView } from './components/dashboard/DataExplorerView';
import { ChatPanel } from './components/chat/ChatPanel';
import { TextToDashboardModal } from './components/generator/TextToDashboardModal';
import { GcpSettingsModal } from './components/settings/GcpSettingsModal';

export function DashboardContent() {
  const { activeView } = useApp();

  return (
    <div className="flex-1 min-w-0 p-6 overflow-y-auto max-w-[1700px] mx-auto w-full">
      {activeView === 'overview' && <OverviewDashboard />}
      {activeView === 'models' && <MLModelRunner />}
      {activeView === 'dynamic' && <DynamicDashboardView />}
      {activeView === 'explorer' && <DataExplorerView />}
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <DashboardContent />
      </div>

      {/* Slideout Chat Assistant */}
      <ChatPanel />

      {/* Modals */}
      <TextToDashboardModal />
      <GcpSettingsModal />
    </div>
  );
}
