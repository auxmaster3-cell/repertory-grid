import React, { useState, useMemo } from 'react';
import useStore from '../store/useStore';

const SCALE_POINTS = [
  { value: 1, label: 'Очень низко', color: 'bg-red-400' },
  { value: 2, label: 'Низко', color: 'bg-red-300' },
  { value: 3, label: 'Ниже среднего', color: 'bg-orange-300' },
  { value: 4, label: 'Чуть ниже среднего', color: 'bg-orange-200' },
  { value: 5, label: 'Средне', color: 'bg-yellow-300' },
  { value: 6, label: 'Чуть выше среднего', color: 'bg-lime-300' },
  { value: 7, label: 'Выше среднего', color: 'bg-emerald-300' },
  { value: 8, label: 'Высоко', color: 'bg-emerald-400' },
  { value: 9, label: 'Очень высоко', color: 'bg-emerald-500' },
];

export default function EvaluateGrid() {
  const { sessions, activeSessionId, setRating, setSelfRating, setImportance, updateSession, navigate, completeSession } = useStore();
  const session = sessions.find((s) => s.id === activeSessionId);
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [showSelfEvaluation, setShowSelfEvaluation] = useState(false);
  const [showImportance, setShowImportance] = useState(false);

  if (!session) return <div className="coach-card">Сессия не найдена</div>;

  const allElements = useMemo(() => [
    ...session.elements,
    { id: 'self-now', name: 'Я сейчас', isSelf: true, selfType: 'selfNow' },
    { id: 'self-ideal', name: 'Я идеал', isSelf: true, selfType: 'selfIdeal' },
  ], [session.elements]);

  const currentElement = allElements[currentElementIndex];
  const progress = ((currentElementIndex) / allElements.length) * 100;

  const handleRating = (constructId, score) => {
    if (currentElement.isSelf) {
      setSelfRating(activeSessionId, currentElement.selfType, constructId, score);
    } else {
      setRating(activeSessionId, currentElement.id, constructId, score);
    }
  };

  const getCurrentRating = (constructId) => {
    if (currentElement.isSelf) {
      return session.selfRatings[currentElement.selfType]?.[constructId] || null;
    }
    return session.ratings[currentElement.id]?.[constructId] || null;
  };

  const handleNext = () => {
    if (currentElementIndex < allElements.length - 1) {
      setCurrentElementIndex(currentElementIndex + 1);
    } else if (!showSelfEvaluation && currentElementIndex === allElements.length - 2) {
      setShowSelfEvaluation(true);
    } else {
      setShowImportance(true);
    }
  };

  const handleComplete = () => {
    completeSession(activeSessionId);
    navigate('analysis');
  };

  if (showImportance) {
    return <ImportanceRating session={session} onComplete={handleComplete} onBack={() => setShowImportance(false)} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="coach-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-ink">Оценка решётки</h2>
          <span className="text-sm text-muted">
            {currentElementIndex + 1} из {allElements.length}
          </span>
        </div>
        <div className="w-full bg-primary-100 rounded-full h-2">
          <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="coach-card">
        <div className="text-center mb-6">
          <p className="text-sm text-muted mb-1">Оцените</p>
          <h3 className="text-2xl font-bold text-ink">
            {currentElement.name}
            {currentElement.isSelf && (
              <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                currentElement.selfType === 'selfNow' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {currentElement.selfType === 'selfNow' ? 'Текущее состояние' : 'Цель развития'}
              </span>
            )}
          </h3>
          {!currentElement.isSelf && (
            <p className="text-sm text-muted mt-1">
              {currentElement.relationship === 'manager' ? 'Руководитель' :
               currentElement.relationship === 'subordinate' ? 'Подчинённый' :
               currentElement.relationship === 'mentor' ? 'Наставник' : 'Коллега'}
            </p>
          )}
        </div>

        {currentElement.isSelf && currentElement.selfType === 'selfNow' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Коучинговая подсказка:</strong> Оценивайте себя честно, но без самокритики.
              Это не экзамен — это отправная точка для вашего развития. Отмечайте то, что проявляется
              <em> регулярно</em> в вашем поведении, а не в лучшие или худшие дни.
            </p>
          </div>
        )}

        {currentElement.isSelf && currentElement.selfType === 'selfIdeal' && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-purple-800">
              <strong>Коучинговая подсказка:</strong> «Я идеал» — не абстрактный герой, а реалистичная,
              достижимая версия вас. Подумайте: каким/какой вы хотите быть через 6–12 месяцев
              <em> в контексте вашей реальной роли</em>?
            </p>
          </div>
        )}

        <div className="space-y-4">
          {session.constructs.map((construct) => {
            const currentRating = getCurrentRating(construct.id);
            return (
              <div key={construct.id} className="border border-primary-100 rounded-2xl p-4 hover:border-primary-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-ink">{construct.name}</p>
                    {construct.description && (
                      <p className="text-xs text-muted mt-0.5">{construct.description}</p>
                    )}
                  </div>
                  {currentRating && (
                    <span className="coach-chip bg-primary-100 text-primary-700 font-bold text-sm">
                      {currentRating}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {SCALE_POINTS.map((point) => (
                    <button
                      key={point.value}
                      onClick={() => handleRating(construct.id, point.value)}
                      className={`flex-1 h-10 rounded-xl transition-all text-xs font-medium ${
                        currentRating === point.value
                          ? `${point.color} text-white shadow-md scale-105 ring-2 ring-offset-1 ring-primary-500`
                          : 'bg-primary-50 text-muted hover:bg-primary-100 hover:text-ink'
                      }`}
                      title={point.label}
                    >
                      {point.value}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[10px] text-muted">{SCALE_POINTS[0].label}</span>
                  <span className="text-[10px] text-muted">{SCALE_POINTS[8].label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          disabled={currentElementIndex === 0}
          onClick={() => setCurrentElementIndex(currentElementIndex - 1)}
          className="coach-btn-secondary"
        >
          ← Назад
        </button>
        <button onClick={handleNext} className="coach-btn-primary">
          {currentElementIndex < allElements.length - 1 ? 'Далее →' : 'К важности конструктов →'}
        </button>
      </div>
    </div>
  );
}

function ImportanceRating({ session, onComplete, onBack }) {
  const { setImportance, activeSessionId } = useStore();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="coach-card">
        <h2 className="text-xl font-bold text-ink mb-2">Важность компетенций</h2>
        <div className="bg-secondary-50 border border-secondary-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-secondary-800">
            <strong>Последний шаг:</strong> Оцените, насколько каждая компетенция важна для вашей роли.
            Это поможет расставить приоритеты в плане действий — фокусироваться стоит на том,
            что важно <em>и</em> имеет наибольший разрыв.
          </p>
        </div>

        <div className="space-y-4">
          {session.constructs.map((construct) => {
            const importance = session.importanceRatings?.[construct.id] || 5;
            return (
              <div key={construct.id} className="flex items-center gap-4 p-3 border border-primary-100 rounded-2xl">
                <div className="flex-1">
                  <p className="font-medium text-ink text-sm">{construct.name}</p>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7,8,9].map((v) => (
                    <button
                      key={v}
                      onClick={() => setImportance(activeSessionId, construct.id, v)}
                      className={`w-7 h-7 rounded-xl text-xs font-medium transition-all ${
                        importance === v
                          ? 'bg-secondary-400 text-white shadow'
                          : 'bg-primary-50 text-muted hover:bg-primary-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="coach-btn-secondary">← Назад к оценке</button>
        <button onClick={onComplete} className="coach-btn-primary bg-success hover:bg-emerald-600">
          Завершить и увидеть анализ ✨
        </button>
      </div>
    </div>
  );
}
