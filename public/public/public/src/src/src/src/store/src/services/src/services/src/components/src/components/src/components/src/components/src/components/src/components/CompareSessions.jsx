import React, { useState, useMemo, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import * as d3 from 'd3';
import { calculatePCA } from '../services/pca';

export default function CompareSessions() {
  const { sessions, navigate } = useStore();
  const completedSessions = sessions.filter((s) => s.phase === 'completed');
  const [selectedIds, setSelectedIds] = useState([]);
  const svgRef = useRef(null);

  const toggleSession = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selectedSessions = useMemo(
    () => sessions.filter((s) => selectedIds.includes(s.id)),
    [sessions, selectedIds]
  );

  const allConstructs = useMemo(() => {
    const names = new Set();
    selectedSessions.forEach((s) => s.constructs.forEach((c) => names.add(c.name)));
    return [...names];
  }, [selectedSessions]);

  const pcaPoints = useMemo(() => {
    if (selectedSessions.length < 2) return [];
    const allPoints = [];
    selectedSessions.forEach((session) => {
      const selfNowValues = session.constructs.map((c) => session.selfRatings.selfNow?.[c.id] || 5);
      const selfIdealValues = session.constructs.map((c) => session.selfRatings.selfIdeal?.[c.id] || 5);
      allPoints.push({
        id: `${session.title} — Я сейчас`,
        sessionTitle: session.title,
        type: 'selfNow',
        values: selfNowValues,
        sessionId: session.id,
      });
      allPoints.push({
        id: `${session.title} — Я идеал`,
        sessionTitle: session.title,
        type: 'selfIdeal',
        values: selfIdealValues,
        sessionId: session.id,
      });
    });
    return allPoints;
  }, [selectedSessions]);

  const pcaResult = useMemo(() => {
    if (pcaPoints.length < 3) return { coordinates: [], variance: [0, 0] };
    const maxLen = Math.max(...pcaPoints.map((p) => p.values.length));
    const normalized = pcaPoints.map((p) => ({
      ...p,
      values: [...p.values, ...Array(maxLen - p.values.length).fill(5)],
    }));
    return calculatePCA(normalized);
  }, [pcaPoints]);

  useEffect(() => {
    if (!svgRef.current || pcaResult.coordinates.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const width = 650, height = 420;
    const margin = { top: 30, right: 40, bottom: 40, left: 40 };
    const coords = pcaResult.coordinates;
    const xs = coords.map((d) => d.x), ys = coords.map((d) => d.y);
    const xRange = Math.max(Math.abs(d3.max(xs)), Math.abs(d3.min(xs))) * 1.3 || 1;
    const yRange = Math.max(Math.abs(d3.max(ys)), Math.abs(d3.min(ys))) * 1.3 || 1;
    const xScale = d3.scaleLinear().domain([-xRange, xRange]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-yRange, yRange]).range([height - margin.bottom, margin.top]);
    const g = svg.append('g');
    g.append('line').attr('x1', margin.left).attr('x2', width - margin.right).attr('y1', yScale(0)).attr('y2', yScale(0)).attr('stroke', '#d1c3ff').attr('stroke-width', 1);
    g.append('line').attr('y1', margin.top).attr('y2', height - margin.bottom).attr('x1', xScale(0)).attr('x2', xScale(0)).attr('stroke', '#d1c3ff').attr('stroke-width', 1);

    const colors = ['#7c5cfc', '#f56b3f', '#4ECBA5', '#f59e0b'];
    const grouped = {};
    coords.forEach((d) => {
      const title = d.id.split(' — ')[0];
      if (!grouped[title]) grouped[title] = {};
      if (d.id.includes('Я сейчас')) grouped[title].selfNow = d;
      if (d.id.includes('Я идеал')) grouped[title].selfIdeal = d;
    });

    Object.entries(grouped).forEach(([title, pts], idx) => {
      const color = colors[idx % colors.length];
      if (pts.selfNow && pts.selfIdeal) {
        svg.append('defs').append('marker')
          .attr('id', `arrow-${idx}`).attr('viewBox', '0 0 10 10').attr('refX', 10).attr('refY', 5)
          .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
          .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', color);
        g.append('line')
          .attr('x1', xScale(pts.selfNow.x)).attr('y1', yScale(pts.selfNow.y))
          .attr('x2', xScale(pts.selfIdeal.x)).attr('y2', yScale(pts.selfIdeal.y))
          .attr('stroke', color).attr('stroke-width', 2.5).attr('opacity', 0.7)
          .attr('marker-end', `url(#arrow-${idx})`);
      }
      [pts.selfNow, pts.selfIdeal].forEach((pt) => {
        if (!pt) return;
        const isSelfNow = pt.type === 'selfNow';
        g.append('circle')
          .attr('cx', xScale(pt.x)).attr('cy', yScale(pt.y))
          .attr('r', isSelfNow ? 7 : 8)
          .attr('fill', isSelfNow ? color : '#fff')
          .attr('stroke', color).attr('stroke-width', 3);
        g.append('text')
          .attr('x', xScale(pt.x) + 10).attr('y', yScale(pt.y) + 4)
          .attr('font-size', '10px').attr('fill', '#2E2C34').attr('font-weight', '500')
          .text(pt.id.length > 28 ? pt.id.substring(0, 28) + '…' : pt.id);
      });
    });
  }, [pcaResult]);

  if (completedSessions.length < 2) {
    return (
      <div className="coach-card text-center py-12">
        <p className="text-muted">Для сравнения нужно минимум 2 завершённые сессии.</p>
        <button onClick={() => navigate('dashboard')} className="coach-btn-primary mt-4">К сессиям</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="coach-card">
        <h2 className="text-xl font-bold text-ink mb-1">Сравнение сессий во времени</h2>
        <p className="text-sm text-muted mb-4">
          Выберите до 4 сессий, чтобы увидеть сдвиг позиций «Я сейчас» и «Я идеал» на общем графике PCA.
          Стрелки показывают вектор развития в каждой сессии.
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {completedSessions.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => toggleSession(s.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                selectedIds.includes(s.id)
                  ? ['bg-primary-500 text-white', 'bg-secondary-400 text-white', 'bg-success text-white', 'bg-amber-500 text-white'][selectedIds.indexOf(s.id) % 4]
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {s.title} ({new Date(s.createdAt).toLocaleDateString('ru', { month: 'short', year: 'numeric' })})
            </button>
          ))}
        </div>
      </div>

      {selectedSessions.length >= 2 && (
        <>
          <div className="coach-card">
            <h3 className="font-semibold text-ink mb-4">Динамика позиций на карте PCA</h3>
            <p className="text-sm text-muted mb-4">
              Каждая стрелка соединяет «Я сейчас» (закрашенный кружок) с «Я идеал» (контурный кружок) для одной сессии.
            </p>
            <div className="bg-calm rounded-3xl p-4 flex justify-center overflow-x-auto">
              <svg ref={svgRef} viewBox="0 0 650 420" className="w-full max-w-[650px]" />
            </div>
          </div>

          <div className="coach-card">
            <h3 className="font-semibold text-ink mb-4">Сравнение разрывов по компетенциям</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary-50">
                    <th className="text-left p-3 rounded-l-2xl">Компетенция</th>
                    {selectedSessions.map((s) => (
                      <th key={s.id} className="p-3 text-center">{s.title}</th>
                    ))}
                    <th className="p-3 text-center rounded-r-2xl">Тренд</th>
                  </tr>
                </thead>
                <tbody>
                  {allConstructs.map((cName) => {
                    const gaps = selectedSessions.map((s) => {
                      const construct = s.constructs.find((c) => c.name === cName);
                      if (!construct) return null;
                      const now = s.selfRatings.selfNow?.[construct.id] || 5;
                      const ideal = s.selfRatings.selfIdeal?.[construct.id] || 7;
                      return ideal - now;
                    });
                    const trendVals = gaps.filter((g) => g !== null);
                    const trendIcon = trendVals.length >= 2
                      ? trendVals[trendVals.length - 1] < trendVals[0] ? '↘ Улучшение' : trendVals[trendVals.length - 1] > trendVals[0] ? '↗ Рост разрыва' : '→ Стабильно'
                      : '—';
                    return (
                      <tr key={cName} className="border-b border-primary-100">
                        <td className="p-3 font-medium">{cName}</td>
                        {gaps.map((gap, idx) => (
                          <td key={idx} className={`p-3 text-center ${gap === null ? 'text-muted' : gap <= 1 ? 'text-success' : gap <= 3 ? 'text-secondary-500' : 'text-red-500'}`}>
                            {gap !== null ? gap.toFixed(1) : '—'}
                          </td>
                        ))}
                        <td className={`p-3 text-center text-xs font-medium ${
                          trendIcon.includes('Улучшение') ? 'text-success' : trendIcon.includes('Рост') ? 'text-red-500' : 'text-muted'
                        }`}>
                          {trendIcon}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <CoachingInsight selectedSessions={selectedSessions} />
        </>
      )}
    </div>
  );
}

function CoachingInsight({ selectedSessions }) {
  const insights = useMemo(() => {
    if (selectedSessions.length < 2) return [];
    const first = selectedSessions[0];
    const last = selectedSessions[selectedSessions.length - 1];
    const commonConstructs = first.constructs.filter((c1) =>
      last.constructs.some((c2) => c2.name === c1.name)
    );
    const improvements = [], regressions = [];
    commonConstructs.forEach((c1) => {
      const c2 = last.constructs.find((c) => c.name === c1.name);
      const gap1 = (first.selfRatings.selfIdeal?.[c1.id] || 7) - (first.selfRatings.selfNow?.[c1.id] || 5);
      const gap2 = (last.selfRatings.selfIdeal?.[c2.id] || 7) - (last.selfRatings.selfNow?.[c2.id] || 5);
      if (gap2 < gap1 - 0.5) improvements.push(c1.name);
      if (gap2 > gap1 + 0.5) regressions.push(c1.name);
    });
    return { improvements, regressions };
  }, [selectedSessions]);

  if (!insights.improvements.length && !insights.regressions.length) return null;

  return (
    <div className="coach-card bg-gradient-to-r from-primary-50 to-success/20 border-primary-200">
      <h3 className="font-semibold text-primary-900 mb-3">Коучинговый инсайт</h3>
      {insights.improvements.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-success/80 mb-1">Области прогресса:</p>
          <p className="text-sm text-green-800">
            Разрыв сократился по компетенциям: <strong>{insights.improvements.join(', ')}</strong>.
            Это зоны, где ваши усилия приносят плоды. Отметьте для себя, какие действия были наиболее эффективными.
          </p>
        </div>
      )}
      {insights.regressions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-secondary-600 mb-1">Зоны внимания:</p>
          <p className="text-sm text-secondary-800">
            Разрыв увеличился по компетенциям: <strong>{insights.regressions.join(', ')}</strong>.
            Это не повод для самокритики — возможно, вы пересмотрели стандарты или изменился контекст.
          </p>
        </div>
      )}
    </div>
  );
}
