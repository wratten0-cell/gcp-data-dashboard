import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGcpStatus, listDashboards } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation: 'overview' | 'models' | 'dynamic' | 'explorer'
  const [activeView, setActiveView] = useState('overview');
  
  // Active Dynamic Dashboard ID
  const [activeDashboardId, setActiveDashboardId] = useState(null);
  
  // Available Dashboards List
  const [dashboardsList, setDashboardsList] = useState([]);
  
  // GCP Status state
  const [gcpStatus, setGcpStatus] = useState({
    mode: 'live',
    project_id: 'tribal-datum-507019-m0',
    region: 'us-central1',
    dataset_id: 'uploadeddataset',
    has_gemini_key: false,
    authenticated: true,
    available_tables: ['packages']
  });

  // Chat panel open/close
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Settings modal open/close
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Text-to-Dashboard modal open/close
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);

  // Load initial status and dashboards
  const refreshStatus = async () => {
    try {
      const status = await getGcpStatus();
      setGcpStatus(status);
    } catch (err) {
      console.warn('Could not fetch GCP status:', err);
    }
  };

  const refreshDashboards = async () => {
    try {
      const data = await listDashboards();
      setDashboardsList(data.dashboards || []);
    } catch (err) {
      console.warn('Could not fetch dashboards:', err);
    }
  };

  useEffect(() => {
    refreshStatus();
    refreshDashboards();
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        activeDashboardId,
        setActiveDashboardId,
        dashboardsList,
        setDashboardsList,
        refreshDashboards,
        gcpStatus,
        setGcpStatus,
        refreshStatus,
        isChatOpen,
        setIsChatOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isGenModalOpen,
        setIsGenModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
