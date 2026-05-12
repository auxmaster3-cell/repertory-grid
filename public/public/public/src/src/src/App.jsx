import React, { useEffect, useCallback } from 'react';
import useStore from './store/useStore';
import Dashboard from './components/Dashboard';
import CreateGrid from './components/CreateGrid';
import EvaluateGrid from './components/EvaluateGrid';
import AnalysisView from './components/AnalysisView';
import CompareSessions from './components/CompareSessions';
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';

export default function App() {
  const { currentView, loadSessions, setOnline, addToast, isOnline } = useStore();

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); addToast('Вы снова онлайн', 'success'); };
    const handleOffline = () => { setOnline(false); addToast('Вы офлайн — всё сохранится локально', 'warning'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, addToast]);

  const renderView = useCallback(() => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'create-grid': return <CreateGrid />;
      case 'evaluate-grid': return <EvaluateGrid />;
      case 'analysis': return <AnalysisView />;
      case 'compare': return <CompareSessions />;
      default: return <Dashboard />;
    }
  }, [currentView]);

  return (
    <div className="min-h-screen bg-calm text-ink">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {renderView()}
      </main>
      <ToastContainer />
      {!isOnline && (
        <div className="fixed bottom-4 left-4 bg-secondary-400 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          Офлайн-режим
        </div>
      )}
    </div>
  );
}
