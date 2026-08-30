import React from 'react';
import { 
  Package, 
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
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md px-6 py-3 transition-colors">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Clean USPS Control Tower Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-600 text-white shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
              USPS Control Tower
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Logistics & Revenue Intelligence
            </p>
          </div>
        </div>

        {/* Center: Clean BigQuery Source Indicator */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-300">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-zinc-400 font-sans">Source:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">{gcpStatus.dataset_id}.packages</span>
          </div>

          <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-750" />

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3 h-3" /> Demo
              </span>
            )}
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Create Dashboard Button */}
          <button
            onClick={() => setIsGenModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">Create Dashboard</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* AI Chat Drawer Toggle */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isChatOpen
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">Assistant</span>
          </button>

          {/* GCP Config Gear */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dark/Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        </div>

      </div>
    </header>
  );
}
