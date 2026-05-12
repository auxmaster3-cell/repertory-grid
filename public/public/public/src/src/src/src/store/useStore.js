import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db, saveSession, loadAllSessions, deleteSession } from '../services/db';

const DEFAULT_COMPETENCIES = [
  { id: 'c1', name: 'Стратегическое мышление', description: 'Способность видеть картину целиком, предвидеть тренды и выстраивать долгосрочные планы' },
  { id: 'c2', name: 'Эмпатия', description: 'Умение понимать чувства и потребности других, создавать атмосферу доверия' },
  { id: 'c3', name: 'Решительность', description: 'Готовность принимать сложные решения в условиях неопределённости' },
  { id: 'c4', name: 'Коммуникация', description: 'Ясная и убедительная передача идей, активное слушание' },
  { id: 'c5', name: 'Адаптивность', description: 'Гибкость в меняющихся условиях, открытость новому' },
  { id: 'c6', name: 'Управление исполнением', description: 'Доведение задач до результата, контроль сроков и качества' },
  { id: 'c7', name: 'Развитие команды', description: 'Инвестирует время в рост сотрудников, даёт развивающую обратную связь' },
  { id: 'c8', name: 'Кросс-функциональное взаимодействие', description: 'Эффективно сотрудничает с другими подразделениями' },
  { id: 'c9', name: 'Инновационность', description: 'Предлагает и внедряет новые подходы, не боится экспериментов' },
  { id: 'c10', name: 'Стрессоустойчивость', description: 'Сохраняет продуктивность и ясность мышления под давлением' }
];

const useStore = create((set, get) => ({
  currentView: 'dashboard',
  sessions: [],
  activeSessionId: null,
  activeMode: null,
  isOnline: navigator.onLine,
  toasts: [],

  loadSessions: async () => {
    const sessions = await loadAllSessions();
    set({ sessions });
  },

  createSession: async (mode) => {
    const sessionId = uuidv4();
    const constructs = mode === 'express'
      ? DEFAULT_COMPETENCIES.map((c) => ({ ...c, isCustom: false }))
      : [];
    const session = {
      id: sessionId,
      title: `Сессия ${new Date().toLocaleDateString('ru')}`,
      mode,
      createdAt: new Date().toISOString(),
      phase: 'elements',
      elements: [],
      constructs,
      ratings: {},
      importanceRatings: {},
      selfRatings: { selfNow: {}, selfIdeal: {} },
      actionPlan: [],
      completedAt: null,
      sharedLink: null,
    };
    await saveSession(session);
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: sessionId,
      activeMode: mode,
      currentView: mode === 'express' ? 'evaluate-grid' : 'create-grid',
    }));
    return sessionId;
  },

  setActiveSession: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    set({ activeSessionId: sessionId, activeMode: session?.mode || null });
  },

  updateSession: async (sessionId, updates) => {
    const updated = get().sessions.map((s) =>
      s.id === sessionId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    const fullSession = updated.find((s) => s.id === sessionId);
    await saveSession(fullSession);
    set({ sessions: updated });
  },

  addElement: async (sessionId, element) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const newElement = { id: uuidv4(), ...element };
    const updatedElements = [...(session?.elements || []), newElement];
    await get().updateSession(sessionId, { elements: updatedElements });
  },

  removeElement: async (sessionId, elementId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const updatedElements = session.elements.filter((e) => e.id !== elementId);
    const updatedRatings = { ...session.ratings };
    delete updatedRatings[elementId];
    await get().updateSession(sessionId, { elements: updatedElements, ratings: updatedRatings });
  },

  addConstruct: async (sessionId, construct) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const newConstruct = { id: uuidv4(), ...construct, isCustom: true };
    const updatedConstructs = [...(session?.constructs || []), newConstruct];
    await get().updateSession(sessionId, { constructs: updatedConstructs });
  },

  setRating: async (sessionId, elementId, constructId, score) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const updatedRatings = {
      ...session.ratings,
      [elementId]: { ...(session.ratings[elementId] || {}), [constructId]: score },
    };
    await get().updateSession(sessionId, { ratings: updatedRatings });
  },

  setSelfRating: async (sessionId, selfType, constructId, score) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const updatedSelf = {
      ...session.selfRatings,
      [selfType]: { ...(session.selfRatings[selfType] || {}), [constructId]: score },
    };
    await get().updateSession(sessionId, { selfRatings: updatedSelf });
  },

  setImportance: async (sessionId, constructId, importance) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const updated = { ...session.importanceRatings, [constructId]: importance };
    await get().updateSession(sessionId, { importanceRatings: updated });
  },

  completeSession: async (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const actionPlan = generateActionPlan(session);
    await get().updateSession(sessionId, {
      phase: 'completed',
      completedAt: new Date().toISOString(),
      actionPlan,
    });
    get().scheduleReminder(sessionId);
  },

  scheduleReminder: async (sessionId) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register(`coach-reminder-${sessionId}`);
    }
    get().addToast('Напоминание запланировано через 2 недели', 'info');
  },

  generateSharedLink: (sessionId) => {
    const token = uuidv4().replace(/-/g, '').substring(0, 16);
    const link = `${window.location.origin}/shared/${token}`;
    get().updateSession(sessionId, { sharedLink: { token, createdAt: new Date().toISOString() } });
    return link;
  },

  removeSession: async (sessionId) => {
    await deleteSession(sessionId);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
    }));
  },

  exportSession: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repertory-grid-${session.title.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    get().addToast('Сессия экспортирована', 'success');
  },

  importSession: async (file) => {
    const text = await file.text();
    const session = JSON.parse(text);
    session.id = session.id || uuidv4();
    session.importedAt = new Date().toISOString();
    await saveSession(session);
    set((state) => ({ sessions: [...state.sessions, session] }));
    get().addToast('Сессия импортирована', 'success');
  },

  navigate: (view) => set({ currentView: view }),

  addToast: (message, type = 'info') => {
    const id = uuidv4();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  setOnline: (status) => set({ isOnline: status }),
}));

function generateActionPlan(session) {
  const { constructs, selfRatings } = session;
  const plan = [];
  const selfNow = selfRatings.selfNow || {};
  const selfIdeal = selfRatings.selfIdeal || {};

  constructs.forEach((c) => {
    const now = selfNow[c.id] || 5;
    const ideal = selfIdeal[c.id] || 7;
    const gap = ideal - now;
    if (gap >= 2) {
      plan.push({
        id: uuidv4(),
        constructId: c.id,
        constructName: c.name,
        currentScore: now,
        targetScore: ideal,
        gap,
        action: '',
        deadline: '',
        status: 'planned',
        priority: gap >= 4 ? 'high' : gap >= 3 ? 'medium' : 'low',
      });
    }
  });

  return plan.sort((a, b) => b.gap - a.gap);
}

export default useStore;
