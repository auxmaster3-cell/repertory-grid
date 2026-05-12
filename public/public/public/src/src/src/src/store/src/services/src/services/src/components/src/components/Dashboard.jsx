import React, { useState } from 'react';
import useStore from '../store/useStore';

export default function Dashboard() {
  const { sessions, createSession, setActiveSession, navigate, removeSession, exportSession } = useStore();
  const [modeChoice, setModeChoice] = useState(null);

  const completedSessions = sessions.filter((s) => s.phase === 'completed');
  const inProgressSessions = sessions.filter((s) => s.phase !== 'completed');

  const handleCreate = async (mode) => {
    const sessionId = await createSession(mode);
    setModeChoice(null);
    if (mode === 'express') {
      navigate('evaluate-grid');
    } else {
      navigate('create-grid');
    }
  };

  return (
    <div className="space-y-8">
      <div className="coach-card">
        <h2 className="text-2xl font-bold text-ink mb-2">
          {sessions.length === 0 ? 'Добро пожаловать в Repertory Grid Coach' : 'Ваши коучинговые сессии'}
        </h2>
        <p className="text-muted mb-6">
          Инструмент для исследования восприятия компетенций — ваших и тех, кто вас окружает.
          Выберите формат работы:
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleCreate('express')}
            className="p-5 border-2 border-primary-200 rounded-3xl text-left hover:border-primary-400 hover:bg-primary-50/50 transition-all group"
          >
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-ink group-hover:text-primary-700">Экспресс-решётка</h3>
            <p className="text-sm text-muted mt-1">
              Предустановленный набор из 10 управленческих компетенций. Оцените себя и значимых других за 15 минут.
            </p>
            <span className="inline-block mt-3 text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
              Быстрый старт
            </span>
          </button>

          <button
            onClick={() => handleCreate('free')}
            className="p-5 border-2 border-primary-200 rounded-3xl text-left hover:border-primary-400 hover:bg-primary-50/50 transition-all group"
          >
            <div className="text-3xl mb-2">🧠</div>
            <h3 className="font-semibold text-ink group-hover:text-primary-700">Свободная решётка</h3>
            <p className="text-sm text-muted mt-1">
              Классический метод Келли. Вы сами определяете элементы и конструкты, важные именно для вашего контекста.
            </p>
            <span className="inline-block mt-3 text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded-full">
              Полная гибкость
            </span>
          </button>
        </div>
      </div>

      {inProgressSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-ink mb-3">В процессе</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onContinue={() => {
                  setActiveSession(session.id);
                  navigate(session.phase === 'elements' ? 'create-grid' : 'evaluate-grid');
                }}
                onDelete={() => removeSession(session.id)}
                onExport={() => exportSession(session.id)}
              />
            ))}
          </div>
        </div>
      )}

      {completedSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-ink mb-3">Завершённые</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onContinue={() => { setActiveSession(session.id); navigate('analysis'); }}
                onDelete={() => removeSession(session.id)}
                onExport={() => exportSession(session.id)}
                completed
              />
            ))}
          </div>
        </div>
      )}

      {completedSessions.length >= 2 && (
        <div className="coach-card bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-primary-900">Динамика развития</h3>
              <p className="text-sm text-primary-700 mt-1">
                У вас есть {completedSessions.length} завершённые сессии. Сравните их, чтобы увидеть прогресс.
              </p>
            </div>
            <button onClick={() => navigate('compare')} className="coach-btn-primary">
              Сравнить сессии
            </button>
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 text-muted">
          <div className="text-6xl mb-4">🪄</div>
          <p>У вас пока нет сессий. Создайте первую решётку выше.</p>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onContinue, onDelete, onExport, completed }) {
  const phaseLabels = {
    elements: 'Определение элементов',
    constructs: 'Определение конструктов',
    evaluation: 'Оценка',
    completed: 'Завершена',
  };

  return (
    <div className="coach-card group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-ink">{session.title}</h4>
          <p className="text-xs text-muted mt-0.5">
            {new Date(session.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`coach-chip ${
          completed ? 'bg-success/10 text-success' : 'bg-secondary-100 text-secondary-700'
        }`}>
          {phaseLabels[session.phase]}
        </span>
      </div>

      <div className="text-xs text-muted mb-4 space-y-1">
        <div>Элементов: {session.elements?.length || 0}</div>
        <div>Конструктов: {session.constructs?.length || 0}</div>
        <div>Режим: {session.mode === 'express' ? '⚡ Экспресс' : '🧠 Свободный'}</div>
      </div>

      <div className="flex gap-2">
        <button onClick={onContinue} className="flex-1 coach-btn-primary text-sm !py-2">
          {completed ? 'Анализ' : 'Продолжить'}
        </button>
        <button onClick={onExport} className="coach-btn-secondary text-sm !px-3 !py-2" title="Экспорт">📤</button>
        <button onClick={onDelete} className="coach-btn-secondary text-sm !px-3 !py-2 text-secondary-600 hover:bg-secondary-50" title="Удалить">🗑</button>
      </div>
    </div>
  );
}
