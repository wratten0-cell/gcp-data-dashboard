import React from 'react';
import { 
  Cloud, 
  Sparkles, 
  MessageSquare, 
  Sun, 
  Moon, 
  Settings, 
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

export function Header() {
  const { gcpStatus, setIsChatOpen, isChatOpen, setIsSettingsOpen, setIsGenModalOpen } = useApp();
  const { theme, toggleTheme } = useTheme();

  const isLive = gcpStatus.mode === 'live';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md px-6 py-3.5 transition-colors">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand & Platform Title */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                GCP Intelligence Platform
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                BigQuery & Vertex AI
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enterprise Data Analytics • ML Studio • Dynamic Visualizations
            </p>
          </div>
        </div>

        {/* Center: GCP Project & Dataset Indicator */}
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-300">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-zinc-400">Project:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">{gcpStatus.project_id}</span>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-700 dark:text-zinc-200">{gcpStatus.dataset_id}</span>
          </div>

          <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Live GCP
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3 h-3" /> Demo Sandbox
              </span>
            )}
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Text-to-Dashboard Magic Button */}
          <button
            onClick={() => setIsGenModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm transition-all duration-200 hover:shadow"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span className="hidden sm:inline">Ask for Chart / Dashboard</span>
            <span className="sm:hidden">Create</span>
          </button>

          {/* AI Chat Drawer Toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              isChatOpen
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="hidden md:inline">Ask AI Assistant</span>
          </button>

          {/* GCP Config Gear */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="GCP Connection Settings"
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dark/Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>

      </div>
    </header>
  );
}
