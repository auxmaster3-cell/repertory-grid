import React, { useRef } from 'react';
import useStore from '../store/useStore';

export default function Header() {
  const { currentView, navigate, activeSessionId, sessions, exportSession, importSession, addToast } = useStore();
  const fileRef = useRef(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const navItems = [
    { id: 'dashboard', label: 'Мои сессии', icon: '📋' },
    { id: 'create-grid', label: 'Новая решётка', icon: '➕' },
    { id: 'compare', label: 'Сравнение', icon: '📊', disabled: sessions.filter((s) => s.phase === 'completed').length < 2 },
    { id: 'analysis', label: 'Анализ', icon: '🔍', disabled: !activeSession || activeSession.phase !== 'completed' },
  ];

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importSession(file);
      } catch {
        addToast('Ошибка импорта файла', 'error');
      }
    }
    e.target.value = '';
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">R</div>
            <div>
              <h1 className="text-lg font-semibold text-ink leading-tight">Repertory Grid Coach</h1>
              <p className="text-xs text-muted">Коучинговый инструмент развития</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && navigate(item.id)}
                disabled={item.disabled}
                className={`px-3 py-2 rounded-2xl text-sm font-medium transition-all ${
                  currentView === item.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-muted hover:bg-primary-50'
                } ${item.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="coach-btn-secondary text-sm !px-3 !py-2"
              title="Импорт сессии"
            >
              📥
            </button>
            {activeSession && (
              <button
                onClick={() => exportSession(activeSessionId)}
                className="coach-btn-secondary text-sm !px-3 !py-2"
                title="Экспорт сессии"
              >
                📤
              </button>
            )}
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </div>
      </div>
    </header>
  );
}
