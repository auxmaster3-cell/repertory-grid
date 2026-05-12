import React, { useState } from 'react';
import useStore from '../store/useStore';

export default function CreateGrid() {
  const { sessions, activeSessionId, updateSession, addElement, removeElement, addConstruct, navigate, addToast } = useStore();
  const session = sessions.find((s) => s.id === activeSessionId);
  const [newElement, setNewElement] = useState({ name: '', role: '', relationship: 'colleague' });
  const [newConstruct, setNewConstruct] = useState({ name: '', description: '' });

  if (!session) return <div className="coach-card">Сессия не найдена</div>;

  const handleAddElement = () => {
    if (!newElement.name.trim()) return;
    addElement(activeSessionId, { ...newElement, name: newElement.name.trim() });
    setNewElement({ name: '', role: '', relationship: 'colleague' });
    addToast(`«${newElement.name.trim()}» добавлен как значимый другой`, 'success');
  };

  const handleAddConstruct = () => {
    if (!newConstruct.name.trim()) return;
    addConstruct(activeSessionId, { ...newConstruct, name: newConstruct.name.trim() });
    setNewConstruct({ name: '', description: '' });
    addToast(`Конструкт «${newConstruct.name.trim()}» добавлен`, 'success');
  };

  const canProceed = session.elements.length >= 3 && session.constructs.length >= 3;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="coach-card">
        <h2 className="text-xl font-bold text-ink mb-1">Создание свободной решётки</h2>
        <p className="text-muted text-sm mb-6">
          Определите значимых людей (элементы) и компетенции (конструкты), которые вы хотите исследовать.
        </p>

        <div className="flex gap-4 mb-6">
          <StepBadge number={1} label="Элементы" done={session.elements.length >= 3} current={session.phase === 'elements'} />
          <StepBadge number={2} label="Конструкты" done={session.constructs.length >= 3} current={session.phase === 'constructs'} />
          <StepBadge number={3} label="Оценка" done={false} current={session.phase === 'evaluation'} />
        </div>

        <section className="mb-8">
          <h3 className="font-semibold text-ink mb-3">
            Элементы — значимые другие <span className="text-muted font-normal">(минимум 3)</span>
          </h3>
          <p className="text-xs text-muted mb-4">
            Включите коллег, руководителей, подчинённых. «Я сейчас» и «Я идеал» добавляются автоматически при оценке.
          </p>

          <div className="flex gap-2 mb-3">
            <input
              className="coach-input flex-1"
              placeholder="Имя человека"
              value={newElement.name}
              onChange={(e) => setNewElement({ ...newElement, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddElement()}
            />
            <select
              className="coach-input w-40"
              value={newElement.relationship}
              onChange={(e) => setNewElement({ ...newElement, relationship: e.target.value })}
            >
              <option value="colleague">Коллега</option>
              <option value="manager">Руководитель</option>
              <option value="subordinate">Подчинённый</option>
              <option value="mentor">Наставник</option>
              <option value="other">Другое</option>
            </select>
            <button onClick={handleAddElement} className="coach-btn-primary !px-4">Добавить</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {session.elements.map((el) => (
              <span key={el.id} className="coach-chip bg-primary-50 text-primary-700 cursor-default">
                {el.name} ({el.relationship === 'manager' ? 'Рук.' : el.relationship === 'subordinate' ? 'Подч.' : 'Кол.'})
                <button onClick={() => removeElement(activeSessionId, el.id)} className="ml-1 text-primary-400 hover:text-secondary-600">&times;</button>
              </span>
            ))}
            {session.elements.length === 0 && (
              <span className="text-sm text-muted italic">Пока нет добавленных элементов</span>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-ink mb-3">
            Конструкты — компетенции <span className="text-muted font-normal">(минимум 3)</span>
          </h3>
          <p className="text-xs text-muted mb-4">
            Сформулируйте поведенческие якоря. Например: «Стратегическое мышление — видит картину целиком и предвидит рыночные тренды».
          </p>

          <div className="flex gap-2 mb-3">
            <input
              className="coach-input flex-1"
              placeholder="Название компетенции"
              value={newConstruct.name}
              onChange={(e) => setNewConstruct({ ...newConstruct, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddConstruct()}
            />
            <input
              className="coach-input flex-[2]"
              placeholder="Описание (поведенческий якорь)"
              value={newConstruct.description}
              onChange={(e) => setNewConstruct({ ...newConstruct, description: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAddConstruct()}
            />
            <button onClick={handleAddConstruct} className="coach-btn-primary !px-4">Добавить</button>
          </div>

          <div className="space-y-2">
            {session.constructs.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-primary-50/50 rounded-2xl p-3">
                <span className="font-medium text-ink text-sm">{c.name}</span>
                {c.description && <span className="text-xs text-muted flex-1">{c.description}</span>}
              </div>
            ))}
            {session.constructs.length === 0 && (
              <span className="text-sm text-muted italic">Пока нет добавленных конструктов</span>
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-between">
        <button onClick={() => navigate('dashboard')} className="coach-btn-secondary">← Назад</button>
        <button
          disabled={!canProceed}
          onClick={() => {
            updateSession(activeSessionId, { phase: 'evaluation' });
            navigate('evaluate-grid');
          }}
          className="coach-btn-primary"
        >
          Перейти к оценке →
        </button>
      </div>

      {!canProceed && (
        <p className="text-center text-sm text-secondary-600">
          Добавьте минимум 3 элемента и 3 конструкта для продолжения
        </p>
      )}
    </div>
  );
}

function StepBadge({ number, label, done, current }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm ${
      done ? 'bg-success/10 text-success' : current ? 'bg-primary-100 text-primary-700' : 'bg-primary-50 text-muted'
    }`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        done ? 'bg-success text-white' : current ? 'bg-primary-500 text-white' : 'bg-primary-200 text-primary-600'
      }`}>
        {done ? '✓' : number}
      </span>
      {label}
    </div>
  );
}
