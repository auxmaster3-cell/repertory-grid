import React, { useState, useMemo, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import * as d3 from 'd3';
import { calculatePCA } from '../services/pca';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalysisView() {
  const { sessions, activeSessionId, navigate } = useStore();
  const session = sessions.find((s) => s.id === activeSessionId);
  const [activeTab, setActiveTab] = useState('pca');

  if (!session || session.phase !== 'completed') {
    return (
      <div className="coach-card text-center py-12">
        <p className="text-muted">Завершите оценку сессии, чтобы увидеть анализ.</p>
        <button onClick={() => navigate('dashboard')} className="coach-btn-primary mt-4">К сессиям</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="coach-card">
        <h2 className="text-xl font-bold text-ink">Анализ: {session.title}</h2>
        <div className="flex gap-2 mt-4 flex-wrap">
          {['pca', 'importance', 'gantt', 'raw'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {{ pca: '🧭 Карта PCA', importance: '📊 Важность–Самовосприятие', gantt: '📅 План действий', raw: '📋 Данные' }[tab]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'pca' && <PCAMap session={session} />}
      {activeTab === 'importance' && <ImportanceMatrix session={session} />}
      {activeTab === 'gantt' && <ActionPlanGantt session={session} />}
      {activeTab === 'raw' && <RawData session={session} />}
    </div>
  );
}

function PCAMap({ session }) {
  const svgRef = useRef(null);

  const pcaData = useMemo(() => {
    const elementIds = [
      ...session.elements.map((e) => e.id),
      'self-now',
      'self-ideal',
    ];
    const elementNames = [
      ...session.elements.map((e) => e.name),
      'Я сейчас',
      'Я идеал',
    ];
    const constructIds = session.constructs.map((c) => c.id);

    const matrix = elementIds.map((eId, i) => ({
      id: elementNames[i],
      elementId: eId,
      isSelf: eId === 'self-now' || eId === 'self-ideal',
      selfType: eId === 'self-now' ? 'selfNow' : eId === 'self-ideal' ? 'selfIdeal' : null,
      values: constructIds.map((cId) => {
        if (eId === 'self-now' || eId === 'self-ideal') {
          return session.selfRatings[eId === 'self-now' ? 'selfNow' : 'selfIdeal']?.[cId] || 5;
        }
        return session.ratings[eId]?.[cId] || 5;
      }),
    }));

    return { matrix, constructIds, elementNames };
  }, [session]);

  const pcaResult = useMemo(() => calculatePCA(pcaData.matrix), [pcaData]);

  useEffect(() => {
    if (!svgRef.current || pcaResult.coordinates.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600, height = 450;
    const margin = { top: 30, right: 30, bottom: 40, left: 40 };
    const coords = pcaResult.coordinates;
    const xs = coords.map((d) => d.x), ys = coords.map((d) => d.y);
    const xRange = Math.max(Math.abs(d3.max(xs)), Math.abs(d3.min(xs))) * 1.2 || 1;
    const yRange = Math.max(Math.abs(d3.max(ys)), Math.abs(d3.min(ys))) * 1.2 || 1;

    const xScale = d3.scaleLinear().domain([-xRange, xRange]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-yRange, yRange]).range([height - margin.bottom, margin.top]);
    const g = svg.append('g');

    g.append('line').attr('x1', margin.left).attr('x2', width - margin.right).attr('y1', yScale(0)).attr('y2', yScale(0)).attr('stroke', '#e2e8f0').attr('stroke-width', 1);
    g.append('line').attr('y1', margin.top).attr('y2', height - margin.bottom).attr('x1', xScale(0)).attr('x2', xScale(0)).attr('stroke', '#e2e8f0').attr('stroke-width', 1);

    coords.forEach((d) => {
      const isSelfNow = d.id === 'Я сейчас', isSelfIdeal = d.id === 'Я идеал';
      const color = isSelfNow ? '#6366f1' : isSelfIdeal ? '#8b5cf6' : '#a78bfa';
      const radius = isSelfNow || isSelfIdeal ? 8 : 6;
      g.append('circle').attr('cx', xScale(d.x)).attr('cy', yScale(d.y)).attr('r', radius).attr('fill', color).attr('stroke', '#fff').attr('stroke-width', 2).attr('opacity', 0.9);
      g.append('text').attr('x', xScale(d.x) + radius + 4).attr('y', yScale(d.y) + 4).attr('font-size', '11px').attr('fill', '#2E2C34').attr('font-weight', isSelfNow || isSelfIdeal ? '600' : '400').text(d.id);
    });

    const selfNow = coords.find((d) => d.id === 'Я сейчас'), selfIdeal = coords.find((d) => d.id === 'Я идеал');
    if (selfNow && selfIdeal) {
      g.append('line').attr('x1', xScale(selfNow.x)).attr('y1', yScale(selfNow.y)).attr('x2', xScale(selfIdeal.x)).attr('y2', yScale(selfIdeal.y)).attr('stroke', '#8b5cf6').attr('stroke-dasharray', '6,3').attr('stroke-width', 2).attr('opacity', 0.6);
    }
  }, [pcaResult]);

  return (
    <div className="coach-card">
      <h3 className="font-semibold text-ink mb-4">Карта восприятия компетенций (PCA)</h3>
      <p className="text-sm text-muted mb-4">
        Расстояние между точками отражает схожесть профилей компетенций.
        <strong> Пунктирная линия</strong> — вектор вашего развития.
      </p>
      <div className="bg-calm rounded-3xl p-4 flex justify-center overflow-x-auto">
        <svg ref={svgRef} viewBox="0 0 600 450" className="w-full max-w-[600px]" />
      </div>
      <p className="text-xs text-muted mt-2">
        Объяснённая дисперсия: PC1 — {(pcaResult.variance[0] * 100).toFixed(0)}%, PC2 — {(pcaResult.variance[1] * 100).toFixed(0)}%
      </p>
    </div>
  );
}

function ImportanceMatrix({ session }) {
  const data = useMemo(() => {
    return session.constructs.map((c) => {
      const selfNow = session.selfRatings.selfNow?.[c.id] || 5;
      const importance = session.importanceRatings?.[c.id] || 5;
      return {
        name: c.name,
        importance,
        selfNow,
      };
    });
  }, [session]);

  return (
    <div className="coach-card">
      <h3 className="font-semibold text-ink mb-4">Матрица «Важность – Самовосприятие»</h3>
      <div className="bg-calm rounded-3xl p-4 overflow-x-auto">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical" margin={{ left: 140, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d1c3ff" />
            <XAxis type="number" domain={[0, 9]} ticks={[1,3,5,7,9]} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6F6B7A' }} width={130} />
            <Tooltip />
            <Bar dataKey="importance" name="Важность" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={14} />
            <Bar dataKey="selfNow" name="Я сейчас" fill="#7c5cfc" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-sm" /> Важность</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary-500 rounded-sm" /> Самооценка «Я сейчас»</span>
      </div>
    </div>
  );
}

function ActionPlanGantt({ session }) {
  const { activeSessionId, updateSession } = useStore();
  const [editingId, setEditingId] = useState(null);
  const [editAction, setEditAction] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const handleSaveAction = (itemId) => {
    const updatedPlan = session.actionPlan.map((item) =>
      item.id === itemId ? { ...item, action: editAction, deadline: editDeadline } : item
    );
    updateSession(activeSessionId, { actionPlan: updatedPlan });
    setEditingId(null);
  };

  const handleStatusChange = (itemId, newStatus) => {
    const updatedPlan = session.actionPlan.map((item) =>
      item.id === itemId ? { ...item, status: newStatus } : item
    );
    updateSession(activeSessionId, { actionPlan: updatedPlan });
  };

  if (!session.actionPlan || session.actionPlan.length === 0) {
    return (
      <div className="coach-card text-center py-8">
        <p className="text-muted">План действий не требуется — разрывы минимальны. Отличная работа!</p>
      </div>
    );
  }

  return (
    <div className="coach-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink">План действий по сближению с «Я идеал»</h3>
        <button
          onClick={() => {
            const planText = session.actionPlan.map((item) =>
              `- ${item.constructName} (разрыв: ${item.gap} балла): ${item.action || '[действие не указано]'} — до ${item.deadline || '[срок не указан]'} [${item.status}]`
            ).join('\n');
            const blob = new Blob([planText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `action-plan-${session.title.replace(/\s+/g, '-')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="coach-btn-secondary text-sm !py-2"
        >
          Скачать план действий
        </button>
      </div>

      <div className="space-y-3">
        {session.actionPlan.map((item) => (
          <div key={item.id} className={`border rounded-2xl p-4 transition-all ${
            item.priority === 'high' ? 'border-secondary-200 bg-secondary-50/30' :
            item.priority === 'medium' ? 'border-amber-200 bg-amber-50/30' :
            'border-primary-100 bg-primary-50/30'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-ink">{item.constructName}</span>
                <span className={`ml-2 coach-chip ${
                  item.priority === 'high' ? 'bg-secondary-100 text-secondary-700' :
                  item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-primary-100 text-primary-600'
                }`}>
                  Разрыв: {item.gap} балла
                </span>
              </div>
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                className="text-xs border rounded-xl px-2 py-1 bg-white"
              >
                <option value="planned">Запланировано</option>
                <option value="in-progress">В процессе</option>
                <option value="completed">Выполнено ✓</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted mb-2">
              <span>Сейчас: {item.currentScore}</span>
              <span>→</span>
              <span className="font-medium text-primary-600">Цель: {item.targetScore}</span>
            </div>

            {editingId === item.id ? (
              <div className="space-y-2">
                <input className="coach-input text-sm" placeholder="Конкретное действие..." value={editAction} onChange={(e) => setEditAction(e.target.value)} />
                <div className="flex gap-2">
                  <input type="date" className="coach-input text-sm" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                  <button onClick={() => handleSaveAction(item.id)} className="coach-btn-primary text-sm !py-2">Сохранить</button>
                  <button onClick={() => setEditingId(null)} className="coach-btn-secondary text-sm !py-2">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted">
                  {item.action ? (
                    <span>{item.action} {item.deadline && <span className="text-xs text-muted">— до {new Date(item.deadline).toLocaleDateString('ru')}</span>}</span>
                  ) : (
                    <span className="text-muted italic">Добавьте конкретное действие</span>
                  )}
                </div>
                <button onClick={() => { setEditingId(item.id); setEditAction(item.action || ''); setEditDeadline(item.deadline || ''); }} className="text-xs text-primary-600 hover:underline">
                  {item.action ? 'Изменить' : 'Добавить'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RawData({ session }) {
  return (
    <div className="coach-card overflow-x-auto">
      <h3 className="font-semibold text-ink mb-4">Сырые данные решётки</h3>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 bg-primary-50 rounded-l-2xl">Элемент</th>
            {session.constructs.map((c) => (
              <th key={c.id} className="p-2 bg-primary-50 text-center font-medium">{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {session.elements.map((el) => (
            <tr key={el.id} className="border-b border-primary-100">
              <td className="p-2 font-medium">{el.name}</td>
              {session.constructs.map((c) => (
                <td key={c.id} className="p-2 text-center">{session.ratings[el.id]?.[c.id] || '-'}</td>
              ))}
            </tr>
          ))}
          <tr className="bg-blue-50/50">
            <td className="p-2 font-medium text-blue-700">Я сейчас</td>
            {session.constructs.map((c) => (
              <td key={c.id} className="p-2 text-center text-blue-700 font-medium">{session.selfRatings.selfNow?.[c.id] || '-'}</td>
            ))}
          </tr>
          <tr className="bg-purple-50/50">
            <td className="p-2 font-medium text-purple-700">Я идеал</td>
            {session.constructs.map((c) => (
              <td key={c.id} className="p-2 text-center text-purple-700 font-medium">{session.selfRatings.selfIdeal?.[c.id] || '-'}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
