import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts'
import type { WorkItem } from '../../types'
import { getPercentile, getGroupKey, getGroupLabel } from '../../lib/mapping'
import { useApp } from '../../lib/context'
import type { GroupBy } from '../../lib/context'

const NAVY   = '#092140'
const TERRA  = '#BF452A'
const SALMON = '#D99789'
const LIGHT  = '#F2C5BB'
const GREEN  = '#16A34A'
const YELLOW = '#CA8A04'
const STATUS_COLORS = [TERRA, NAVY, SALMON, '#6B7280', '#1D4ED8', '#059669', '#7C3AED', '#B45309', '#0891B2', '#BE185D']
const DOT_COLORS = { below50: GREEN, p50_85: YELLOW, p85_95: TERRA, above95: NAVY }
const TT = {
  contentStyle: { backgroundColor: NAVY, border: `1px solid ${TERRA}`, borderRadius: 8, color: '#FFF', fontSize: 12 },
  labelStyle: { color: '#FFF', fontWeight: 700 },
  itemStyle: { color: '#FFF', fontWeight: 700 },
}

function fmtKey(key: string, groupBy: GroupBy): string {
  if (groupBy === 'year') return key
  if (groupBy === 'month') { const [y, m] = key.split('-'); return `${m}/${y.slice(2)}` }
  const p = key.split('-'); if (p.length === 3) return `${p[2]}/${p[1]}/${p[0].slice(2)}`
  return key
}

// Regressão polinomial grau 2
function polyRegression(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return []
  const n = points.length
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const norm = xs.map(x => (x - minX) / (maxX - minX || 1))

  let s0=n, s1=0, s2=0, s3=0, s4=0, t0=0, t1=0, t2=0
  norm.forEach((x, i) => {
    s1+=x; s2+=x*x; s3+=x*x*x; s4+=x*x*x*x
    t0+=ys[i]; t1+=x*ys[i]; t2+=x*x*ys[i]
  })
  const det = s0*(s2*s4-s3*s3) - s1*(s1*s4-s3*s2) + s2*(s1*s3-s2*s2)
  if (Math.abs(det) < 1e-10) return []
  const a = (t0*(s2*s4-s3*s3) - s1*(t1*s4-s3*t2) + s2*(t1*s3-s2*t2)) / det
  const b = (s0*(t1*s4-s3*t2) - t0*(s1*s4-s3*s2) + s2*(s1*t2-t1*s2)) / det
  const c = (s0*(s2*t2-t1*s3) - s1*(s1*t2-t1*s2) + t0*(s1*s3-s2*s2)) / det

  const steps = 30
  return Array.from({ length: steps + 1 }, (_, i) => {
    const nx = i / steps
    const ox = minX + nx * (maxX - minX)
    return { x: ox, y: Math.max(0, a + b * nx + c * nx * nx) }
  })
}

// ─── CFD ─────────────────────────────────────────────────────────────────────
export function CFDChart({ items }: { items: WorkItem[] }) {
  const { t, groupBy, lang } = useApp()
  const [showLabels, setShowLabels] = useState(false)

  const { data, statuses, arrivalVsDeparture } = useMemo(() => {
    const sts = [...new Set(items.map(i => i.currentStatus).filter(Boolean))] as string[]
    const dateMap = new Map<string, Record<string, number>>()
    items.forEach(item => {
      if (!item.entryDate) return
      const key = getGroupKey(item.entryDate, groupBy)
      if (!dateMap.has(key)) { const init: Record<string, number> = {}; sts.forEach(s => (init[s] = 0)); dateMap.set(key, init) }
      if (item.currentStatus) { const e = dateMap.get(key)!; e[item.currentStatus] = (e[item.currentStatus] ?? 0) + 1 }
    })
    // Arrival vs Departure
    const arrMap = new Map<string, number>()
    const depMap = new Map<string, number>()
    items.forEach(i => {
      const ak = getGroupKey(i.entryDate, groupBy)
      arrMap.set(ak, (arrMap.get(ak) ?? 0) + 1)
      if (i.exitDate) { const dk = getGroupKey(i.exitDate, groupBy); depMap.set(dk, (depMap.get(dk) ?? 0) + 1) }
    })
    const allKeys = [...new Set([...arrMap.keys(), ...depMap.keys()])].sort()
    const avd = allKeys.map(k => ({ date: fmtKey(k, groupBy), arrival: arrMap.get(k) ?? 0, departure: depMap.get(k) ?? 0 }))
    const totalArr = [...arrMap.values()].reduce((a, b) => a + b, 0)
    const totalDep = [...depMap.values()].reduce((a, b) => a + b, 0)
    return {
      data: Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, counts]) => ({ date: fmtKey(date, groupBy), ...counts })),
      statuses: sts,
      arrivalVsDeparture: { data: avd, totalArr, totalDep },
    }
  }, [items, groupBy])

  const axisLabel = getGroupLabel(groupBy, lang)
  const arrVsDepInsight = arrivalVsDeparture.totalArr > arrivalVsDeparture.totalDep * 1.1
    ? (lang === 'pt-BR' ? `⚠️ Taxa de entrada (${arrivalVsDeparture.totalArr}) supera saída (${arrivalVsDeparture.totalDep}) — risco de acúmulo de WIP.` : `⚠️ Arrival rate (${arrivalVsDeparture.totalArr}) exceeds departure (${arrivalVsDeparture.totalDep}) — WIP accumulation risk.`)
    : (lang === 'pt-BR' ? `✓ Taxas de entrada e saída equilibradas — sistema estável.` : `✓ Arrival and departure rates balanced — stable system.`)

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowLabels(l => !l)} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${showLabels ? 'bg-[#BF452A] text-white border-[#BF452A]' : 'border-[#D99789] text-[#D99789]'}`}>
          {showLabels ? '✓ ' : ''}{lang === 'pt-BR' ? 'Rótulos' : 'Labels'}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 35, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} />
          <XAxis dataKey="date" tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: axisLabel, position: 'insideBottom', offset: -20, fill: SALMON, fontSize: 11 }} />
          <YAxis tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: t.count, angle: -90, position: 'insideLeft', fill: SALMON, fontSize: 11 }} />
          <Tooltip {...TT} />
          <Legend wrapperStyle={{ color: NAVY, fontSize: 12, paddingTop: 8 }} verticalAlign="top" />
          {statuses.map((s, i) => (
            <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={STATUS_COLORS[i % STATUS_COLORS.length]} fill={STATUS_COLORS[i % STATUS_COLORS.length]} fillOpacity={0.7}>
              {showLabels && <LabelList dataKey={s} position="top" style={{ fill: NAVY, fontSize: 9, fontWeight: 700 }} />}
            </Area>
          ))}
        </AreaChart>
      </ResponsiveContainer>
      {/* Arrival vs Departure widget */}
      <div className="mt-4 p-3 bg-[#F2C5BB]/20 border border-[#F2C5BB] rounded-xl text-sm text-[#092140]">
        <p className="font-semibold text-[#BF452A] mb-2 text-xs">{lang === 'pt-BR' ? 'Taxa de Entrada vs Saída' : 'Arrival vs Departure Rate'}</p>
        <p className="text-xs">{arrVsDepInsight}</p>
      </div>
    </div>
  )
}

// ─── SCATTERPLOT ─────────────────────────────────────────────────────────────
export function ScatterplotChart({ items }: { items: WorkItem[] }) {
  const { t, lang } = useApp()
  const { byColor, p50, p85, p95, trendData, trendDirection } = useMemo(() => {
    const completed = items.filter(i => i.exitDate && i.cycleTime !== undefined)
    const sorted = completed.map(i => i.cycleTime!).sort((a, b) => a - b)
    const p50v = getPercentile(sorted, 50), p85v = getPercentile(sorted, 85), p95v = getPercentile(sorted, 95)
    const below50: object[] = [], p50_85: object[] = [], p85_95: object[] = [], above95: object[] = []
    completed.forEach(i => {
      const pt = { x: i.exitDate!.getTime(), y: i.cycleTime, id: i.id, type: i.type }
      if (i.cycleTime! <= p50v) below50.push(pt)
      else if (i.cycleTime! <= p85v) p50_85.push(pt)
      else if (i.cycleTime! <= p95v) p85_95.push(pt)
      else above95.push(pt)
    })
    const allPts = completed.map(i => ({ x: i.exitDate!.getTime(), y: i.cycleTime! }))
    const trend = polyRegression(allPts)
    const trendDir = trend.length >= 2
      ? (trend[trend.length - 1].y > trend[0].y * 1.1 ? 'up' : trend[trend.length - 1].y < trend[0].y * 0.9 ? 'down' : 'stable')
      : 'stable'
    return { byColor: { below50, p50_85, p85_95, above95 }, p50: p50v, p85: p85v, p95: p95v, trendData: trend, trendDirection: trendDir }
  }, [items])

  const allX = [...byColor.below50, ...byColor.p50_85, ...byColor.p85_95, ...byColor.above95] as { x: number }[]
  const minX = allX.length ? Math.min(...allX.map(d => d.x)) : 0
  const maxX = allX.length ? Math.max(...allX.map(d => d.x)) : 0

  const trendInsight = trendDirection === 'up'
    ? (lang === 'pt-BR' ? '⚠️ Tendência de aumento no cycle time — processo desacelerando.' : '⚠️ Cycle time trending up — process slowing down.')
    : trendDirection === 'down'
      ? (lang === 'pt-BR' ? '✓ Tendência de redução no cycle time — melhoria contínua.' : '✓ Cycle time trending down — continuous improvement.')
      : (lang === 'pt-BR' ? '→ Cycle time estável ao longo do período.' : '→ Cycle time stable over the period.')

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {[{ label: 'P50', value: p50, color: DOT_COLORS.below50 }, { label: 'P85', value: p85, color: DOT_COLORS.p85_95 }, { label: 'P95', value: p95, color: DOT_COLORS.above95 }].map(p => (
            <div key={p.label} className="rounded-xl px-4 py-2 text-center border" style={{ borderColor: p.color, backgroundColor: p.color + '15' }}>
              <p className="text-xs font-bold" style={{ color: p.color }}>{p.label}</p>
              <p className="text-[#092140] font-bold">{p.value} {t.days}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap text-xs">
          {[{ label: '≤P50', color: DOT_COLORS.below50 }, { label: 'P50–P85', color: DOT_COLORS.p50_85 }, { label: 'P85–P95', color: DOT_COLORS.p85_95 }, { label: '>P95', color: DOT_COLORS.above95 }].map(l => (
            <span key={l.label} className="flex items-center gap-1 font-semibold" style={{ color: NAVY }}>
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: l.color }} />{l.label}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 50, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} />
          <XAxis dataKey="x" type="number" domain={[minX, maxX]} tickFormatter={v => new Date(v).toLocaleDateString()} tick={{ fill: SALMON, fontSize: 10 }} tickLine={false} label={{ value: t.completionDate, position: 'insideBottom', offset: -35, fill: SALMON, fontSize: 11 }} />
          <YAxis dataKey="y" type="number" tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: t.cycleTimeDays, angle: -90, position: 'insideLeft', fill: SALMON, fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: TERRA }} {...TT} labelFormatter={v => new Date(v).toLocaleDateString()} />
          <Legend wrapperStyle={{ color: NAVY, fontSize: 12, paddingTop: 4 }} verticalAlign="top" />
          <Scatter name="≤P50" data={byColor.below50 as object[]} fill={DOT_COLORS.below50} fillOpacity={0.85} />
          <Scatter name="P50–P85" data={byColor.p50_85 as object[]} fill={DOT_COLORS.p50_85} fillOpacity={0.85} />
          <Scatter name="P85–P95" data={byColor.p85_95 as object[]} fill={DOT_COLORS.p85_95} fillOpacity={0.85} />
          <Scatter name=">P95" data={byColor.above95 as object[]} fill={DOT_COLORS.above95} fillOpacity={0.85} />
          {/* Linha de tendência */}
          <Scatter name={lang === 'pt-BR' ? 'Tendência' : 'Trend'} data={trendData} fill="none" line={{ stroke: GREEN, strokeWidth: 2, strokeDasharray: '6 3' }} legendType="line" />
          <ReferenceLine y={p50} stroke={DOT_COLORS.below50} strokeWidth={2} strokeDasharray="5 3" label={{ value: `P50: ${p50}d`, fill: DOT_COLORS.below50, fontSize: 11, position: 'insideTopLeft', fontWeight: 700 }} />
          <ReferenceLine y={p85} stroke={DOT_COLORS.p85_95} strokeWidth={2} strokeDasharray="5 3" label={{ value: `P85: ${p85}d`, fill: DOT_COLORS.p85_95, fontSize: 11, position: 'insideTopLeft', fontWeight: 700 }} />
          <ReferenceLine y={p95} stroke={DOT_COLORS.above95} strokeWidth={2} strokeDasharray="5 3" label={{ value: `P95: ${p95}d`, fill: DOT_COLORS.above95, fontSize: 11, position: 'insideTopLeft', fontWeight: 700 }} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-3 p-3 bg-[#F2C5BB]/20 border border-[#F2C5BB] rounded-xl text-xs text-[#092140]">{trendInsight}</div>
    </div>
  )
}

// ─── BREAKDOWN ───────────────────────────────────────────────────────────────
export function BreakdownChart({ items }: { items: WorkItem[] }) {
  const { t, lang } = useApp()
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const [showLabels, setShowLabels] = useState(false)

  const data = useMemo(() => {
    const map = new Map<string, number[]>()
    items.forEach(i => {
      if (!i.currentStatus) return
      const ct = i.cycleTime ?? Math.round((Date.now() - i.entryDate.getTime()) / 86400000)
      if (!map.has(i.currentStatus)) map.set(i.currentStatus, [])
      map.get(i.currentStatus)!.push(ct)
    })
    return Array.from(map.entries()).map(([stage, times], idx) => ({
      stage, avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      count: times.length, fill: STATUS_COLORS[idx % STATUS_COLORS.length],
    })).sort((a, b) => b.avg - a.avg)
  }, [items])

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="flex gap-1 bg-[#F2F2F2] rounded-xl p-1 border border-[#F2C5BB]">
          {(['bar', 'pie'] as const).map(type => (
            <button key={type} onClick={() => setChartType(type)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${chartType === type ? 'bg-[#BF452A] text-white' : 'text-[#D99789] hover:text-[#092140]'}`}>
              {type === 'bar' ? '▬ Barras' : '◉ Pizza'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowLabels(l => !l)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showLabels ? 'bg-[#BF452A] text-white border-[#BF452A]' : 'border-[#D99789] text-[#D99789]'}`}>
          {showLabels ? '✓ ' : ''}{lang === 'pt-BR' ? 'Rótulos' : 'Labels'}
        </button>
      </div>
      {chartType === 'bar' ? (
        <ResponsiveContainer width="100%" height={Math.max(320, data.length * 55)}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 90, bottom: 35, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} horizontal={false} />
            <XAxis type="number" tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: t.avgDays, position: 'insideBottom', offset: -20, fill: SALMON, fontSize: 11 }} />
            <YAxis type="category" dataKey="stage" tick={{ fill: NAVY, fontSize: 11, fontWeight: 600 }} tickLine={false} width={140} />
            <Tooltip {...TT} formatter={v => [`${v} ${t.days}`, t.avgDays]} />
            <Bar dataKey="avg" radius={[0, 6, 6, 0]} name={t.avgDays}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
              {showLabels && <LabelList dataKey="avg" position="right" style={{ fill: NAVY, fontSize: 11, fontWeight: 700 }} formatter={(v: unknown) => `${v}d`} />}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={data} dataKey="avg" nameKey="stage" cx="50%" cy="45%" outerRadius={150} innerRadius={60} label={false}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
            <Tooltip {...TT} formatter={v => [`${v} ${t.days}`, t.avgDays]} />
            <Legend wrapperStyle={{ color: NAVY, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

// ─── HISTOGRAM ───────────────────────────────────────────────────────────────
export function HistogramChart({ items }: { items: WorkItem[] }) {
  const { t, lang } = useApp()
  const [showLabels, setShowLabels] = useState(false)
  const [showTrend, setShowTrend] = useState(false)

  const { data, mean, median, mode, p50, p85, p95, trendData } = useMemo(() => {
    const times = items.filter(i => i.cycleTime !== undefined).map(i => i.cycleTime!)
    if (!times.length) return { data: [], mean: 0, median: 0, mode: 0, p50: 0, p85: 0, p95: 0, trendData: [] }
    const sorted = [...times].sort((a, b) => a - b)
    const med = getPercentile(sorted, 50)
    const p85v = getPercentile(sorted, 85)
    const p95v = getPercentile(sorted, 95)
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    const freq = new Map<number, number>()
    times.forEach(v => freq.set(v, (freq.get(v) ?? 0) + 1))
    const modeVal = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
    const binSize = 7
    const bins = new Map<number, number>()
    times.forEach(val => { const bin = Math.floor(val / binSize) * binSize; bins.set(bin, (bins.get(bin) ?? 0) + 1) })

    // Trend: mean/median/mode ao longo do tempo
    const completedByDate = items.filter(i => i.exitDate && i.cycleTime !== undefined).sort((a, b) => a.exitDate!.getTime() - b.exitDate!.getTime())
    const windowSize = Math.max(5, Math.floor(completedByDate.length / 10))
    const trend = completedByDate.slice(windowSize - 1).map((_, i) => {
      const window = completedByDate.slice(i, i + windowSize).map(x => x.cycleTime!)
      const ws = [...window].sort((a, b) => a - b)
      const wMean = Math.round(window.reduce((a, b) => a + b, 0) / window.length)
      const wMedian = getPercentile(ws, 50)
      return { date: completedByDate[i + windowSize - 1].exitDate!.toLocaleDateString(), mean: wMean, median: wMedian }
    }).filter((_, i) => i % Math.max(1, Math.floor(completedByDate.length / 20)) === 0)

    return {
      data: Array.from(bins.entries()).sort(([a], [b]) => a - b).map(([bin, count]) => ({ bin: `${bin}-${bin + binSize - 1}`, count })),
      mean: avg, median: med, mode: modeVal, p50: med, p85: p85v, p95: p95v, trendData: trend,
    }
  }, [items])

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {[{ label: 'P50', value: p50, color: GREEN }, { label: 'P85', value: p85, color: TERRA }, { label: 'P95', value: p95, color: NAVY }].map(p => (
            <div key={p.label} className="rounded-xl px-3 py-2 text-center border" style={{ borderColor: p.color, backgroundColor: p.color + '15' }}>
              <p className="text-xs font-bold" style={{ color: p.color }}>{p.label}</p>
              <p className="text-[#092140] font-bold text-sm">{p.value}d</p>
            </div>
          ))}
          <div className="bg-[#F2C5BB]/30 border border-[#D99789] rounded-xl px-3 py-2 text-center">
            <p className="text-xs font-bold text-[#D99789]">{t.median}</p>
            <p className="text-[#092140] font-bold text-sm">{median}d</p>
          </div>
          <div className="bg-[#F2C5BB]/30 border border-[#D99789] rounded-xl px-3 py-2 text-center">
            <p className="text-xs font-bold text-[#D99789]">{t.mean}</p>
            <p className="text-[#092140] font-bold text-sm">{mean}d</p>
          </div>
          <div className="bg-[#F2C5BB]/30 border border-[#D99789] rounded-xl px-3 py-2 text-center">
            <p className="text-xs font-bold text-[#D99789]">{t.mode}</p>
            <p className="text-[#092140] font-bold text-sm">{mode}d</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTrend(l => !l)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showTrend ? 'bg-[#092140] text-white border-[#092140]' : 'border-[#D99789] text-[#D99789]'}`}>
            {showTrend ? '✓ ' : ''}{lang === 'pt-BR' ? 'Tendência' : 'Trend'}
          </button>
          <button onClick={() => setShowLabels(l => !l)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showLabels ? 'bg-[#BF452A] text-white border-[#BF452A]' : 'border-[#D99789] text-[#D99789]'}`}>
            {showLabels ? '✓ ' : ''}{lang === 'pt-BR' ? 'Rótulos' : 'Labels'}
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 35, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} />
          <XAxis dataKey="bin" tick={{ fill: SALMON, fontSize: 10 }} tickLine={false} label={{ value: t.cycleTimeDays, position: 'insideBottom', offset: -20, fill: SALMON, fontSize: 11 }} />
          <YAxis tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: t.count, angle: -90, position: 'insideLeft', fill: SALMON, fontSize: 11 }} />
          <Tooltip {...TT} formatter={v => [v, t.count]} />
          <Bar dataKey="count" fill={TERRA} fillOpacity={0.85} radius={[4, 4, 0, 0]}>
            {showLabels && <LabelList dataKey="count" position="top" style={{ fill: NAVY, fontSize: 11, fontWeight: 700 }} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {showTrend && trendData.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#D99789] mb-2">{lang === 'pt-BR' ? 'Evolução da Média e Mediana ao longo do tempo' : 'Mean & Median over time'}</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} />
              <XAxis dataKey="date" tick={{ fill: SALMON, fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: SALMON, fontSize: 10 }} tickLine={false} label={{ value: t.days, angle: -90, position: 'insideLeft', fill: SALMON, fontSize: 10 }} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ color: NAVY, fontSize: 11 }} />
              <Line type="monotone" dataKey="mean" stroke={TERRA} strokeWidth={2} dot={false} name={t.mean} />
              <Line type="monotone" dataKey="median" stroke={GREEN} strokeWidth={2} dot={false} name={t.median} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── AGING — SCATTERPLOT DE PONTOS POR ITEM ──────────────────────────────────
export function AgingChart({ items }: { items: WorkItem[] }) {
  const { t, lang } = useApp()

  const { chartData, p50, p85, p95, statuses } = useMemo(() => {
    const now = Date.now()
    const allCT = items.filter(i => i.cycleTime !== undefined).map(i => i.cycleTime!).sort((a, b) => a - b)
    const p50v = getPercentile(allCT, 50), p85v = getPercentile(allCT, 85), p95v = getPercentile(allCT, 95)
    const inProgress = items.filter(i => !i.exitDate && i.currentStatus)
    const sts = [...new Set(inProgress.map(i => i.currentStatus!))]
    const statusIndex = new Map(sts.map((s, i) => [s, i]))
    const pts = inProgress.map(item => ({
      x: statusIndex.get(item.currentStatus!) ?? 0,
      y: Math.round((now - item.entryDate.getTime()) / 86400000),
      id: item.id,
      type: item.type ?? '',
      status: item.currentStatus!,
    }))
    return { chartData: pts, p50: p50v, p85: p85v, p95: p95v, statuses: sts }
  }, [items])

  const aboveP85 = chartData.filter(d => d.y > p85).length

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { y: number; id: string; type: string } }) => {
    const { cx, cy, payload } = props
    if (!cx || !cy || !payload) return null
    const color = payload.y > p95 ? NAVY : payload.y > p85 ? TERRA : payload.y > p50 ? YELLOW : GREEN
    return <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.85} stroke="#fff" strokeWidth={1} />
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {[{ label: 'P50', value: p50, color: GREEN }, { label: 'P85', value: p85, color: TERRA }, { label: 'P95', value: p95, color: NAVY }].map(p => (
            <div key={p.label} className="rounded-xl px-4 py-2 text-center border" style={{ borderColor: p.color, backgroundColor: p.color + '15' }}>
              <p className="text-xs font-bold" style={{ color: p.color }}>{p.label}</p>
              <p className="text-[#092140] font-bold">{p.value} {t.days}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 text-xs flex-wrap">
          {[{ label: '≤P50', color: GREEN }, { label: 'P50–P85', color: YELLOW }, { label: 'P85–P95', color: TERRA }, { label: '>P95', color: NAVY }].map(l => (
            <span key={l.label} className="flex items-center gap-1 font-semibold" style={{ color: NAVY }}>
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: l.color }} />{l.label}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} />
          <XAxis dataKey="x" type="number" domain={[-0.5, statuses.length - 0.5]} ticks={statuses.map((_, i) => i)} tickFormatter={i => statuses[i] ?? ''} tick={{ fill: NAVY, fontSize: 11, fontWeight: 600 }} tickLine={false} label={{ value: t.status, position: 'insideBottom', offset: -25, fill: SALMON, fontSize: 11 }} />
          <YAxis dataKey="y" type="number" tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: t.ageInDays, angle: -90, position: 'insideLeft', fill: SALMON, fontSize: 11 }} />
          <Tooltip {...TT} content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null
            const d = payload[0].payload as { id: string; type: string; y: number; status: string }
            return (
              <div style={{ backgroundColor: NAVY, border: `1px solid ${TERRA}`, borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12 }}>
                <p className="font-bold">{d.id}</p>
                {d.type && <p>{lang === 'pt-BR' ? 'Tipo' : 'Type'}: {d.type}</p>}
                <p>{d.status}</p>
                <p>{d.y} {t.days}</p>
              </div>
            )
          }} />
          <ReferenceLine y={p50} stroke={GREEN} strokeWidth={2} strokeDasharray="5 3" label={{ value: `P50: ${p50}d`, fill: GREEN, fontSize: 11, position: 'insideTopLeft', fontWeight: 700 }} />
          <ReferenceLine y={p85} stroke={TERRA} strokeWidth={2} strokeDasharray="5 3" label={{ value: `P85: ${p85}d`, fill: TERRA, fontSize: 11, position: 'insideTopLeft', fontWeight: 700 }} />
          <ReferenceLine y={p95} stroke={NAVY} strokeWidth={2} strokeDasharray="5 3" label={{ value: `P95: ${p95}d`, fill: NAVY, fontSize: 11, position: 'insideTopLeft', fontWeight: 700 }} />
          <Scatter data={chartData} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
      {aboveP85 > 0 && (
        <div className="mt-3 p-3 bg-[#F2C5BB]/20 border border-[#F2C5BB] rounded-xl text-xs text-[#092140]">
          {t.insightAgingWarning(aboveP85)}
        </div>
      )}
    </div>
  )
}

// ─── THROUGHPUT RUN ──────────────────────────────────────────────────────────
const TP_RANGES = [{ label: '0–5', min: 0, max: 5 }, { label: '5–15', min: 5, max: 15 }, { label: '15–45', min: 15, max: 45 }, { label: '45–60', min: 45, max: 60 }, { label: '60–90', min: 60, max: 90 }, { label: '>90', min: 90, max: Infinity }]

export function ThroughputRunChart({ items }: { items: WorkItem[] }) {
  const { t, groupBy, lang } = useApp()
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const [showLabels, setShowLabels] = useState(false)

  const { data, avg, trendData, trendDirection, typeBreakdown, allTypes } = useMemo(() => {
    const grpMap = new Map<string, number>()
    const typeMap = new Map<string, Map<string, number>>()
    items.filter(i => i.exitDate).forEach(i => {
      const k = getGroupKey(i.exitDate!, groupBy)
      grpMap.set(k, (grpMap.get(k) ?? 0) + 1)
      const type = i.type ?? (lang === 'pt-BR' ? 'Sem tipo' : 'No type')
      if (!typeMap.has(k)) typeMap.set(k, new Map())
      const tm = typeMap.get(k)!
      tm.set(type, (tm.get(type) ?? 0) + 1)
    })
    const rows = Array.from(grpMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => {
      const tm = typeMap.get(key) ?? new Map()
      const typeData: Record<string, number> = {}
      tm.forEach((v, k) => { typeData[k] = v })
      return { label: fmtKey(key, groupBy), count, ...typeData }
    })
    const a = rows.length ? Math.round(rows.reduce((s, r) => s + r.count, 0) / rows.length) : 0
    const trendPts = rows.map((r, i) => ({ x: i, y: r.count }))
    const trend = polyRegression(trendPts).map((p, i) => ({ label: rows[Math.round(p.x * (rows.length - 1) / 30)]?.label ?? '', y: Math.round(p.y) }))
    const trendDir = trend.length >= 2
      ? (trend[trend.length - 1].y > trend[0].y * 1.1 ? 'up' : trend[trend.length - 1].y < trend[0].y * 0.9 ? 'down' : 'stable')
      : 'stable'
    const allT = [...new Set(items.filter(i => i.exitDate).map(i => i.type ?? (lang === 'pt-BR' ? 'Sem tipo' : 'No type')))]
    const totalByType = new Map<string, number>()
    items.filter(i => i.exitDate).forEach(i => {
      const type = i.type ?? (lang === 'pt-BR' ? 'Sem tipo' : 'No type')
      totalByType.set(type, (totalByType.get(type) ?? 0) + 1)
    })
    const total = [...totalByType.values()].reduce((a, b) => a + b, 0)
    const breakdown = [...totalByType.entries()].map(([type, count], idx) => ({ type, count, pct: Math.round(count / total * 100), fill: STATUS_COLORS[idx % STATUS_COLORS.length] })).sort((a, b) => b.count - a.count)
    return { data: rows, avg: a, trendData: trend, trendDirection: trendDir, typeBreakdown: breakdown, allTypes: allT }
  }, [items, groupBy, lang])

  const pieData = useMemo(() => TP_RANGES.map((range, idx) => ({
    name: range.label,
    value: data.filter(d => d.count >= range.min && d.count < range.max).reduce((s, d) => s + d.count, 0),
    fill: STATUS_COLORS[idx % STATUS_COLORS.length],
  })).filter(d => d.value > 0), [data])

  const grpLabel = getGroupLabel(groupBy, lang)
  const axisLabel = lang === 'pt-BR' ? `itens/${grpLabel.slice(0, -1)}` : `items/${grpLabel.slice(0, -1)}`

  const trendInsight = trendDirection === 'up' ? t.insightThroughputUp : trendDirection === 'down' ? t.insightThroughputDown : null

  return (
    <div>
      {/* Breakdown por tipo */}
      {typeBreakdown.length > 1 && (
        <div className="mb-4 p-3 bg-[#F2F2F2] border border-[#F2C5BB] rounded-xl">
          <p className="text-xs font-semibold text-[#D99789] mb-2">{lang === 'pt-BR' ? 'Breakdown por tipo' : 'Breakdown by type'}</p>
          <div className="flex flex-wrap gap-2">
            {typeBreakdown.map(b => (
              <div key={b.type} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: b.fill }} />
                <span className="font-semibold text-[#092140]">{b.type}</span>
                <span className="text-[#D99789]">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
        <div className="bg-[#F2C5BB]/30 border border-[#D99789] rounded-xl px-4 py-2 text-center">
          <p className="text-xs font-bold text-[#D99789]">{lang === 'pt-BR' ? `Média ${grpLabel}` : `Avg ${grpLabel}`}</p>
          <p className="text-[#092140] font-bold">{avg}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-[#F2F2F2] rounded-xl p-1 border border-[#F2C5BB]">
            {(['bar', 'pie'] as const).map(type => (
              <button key={type} onClick={() => setChartType(type)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${chartType === type ? 'bg-[#BF452A] text-white' : 'text-[#D99789] hover:text-[#092140]'}`}>
                {type === 'bar' ? '▬ Barras' : '◉ Pizza'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowLabels(l => !l)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showLabels ? 'bg-[#BF452A] text-white border-[#BF452A]' : 'border-[#D99789] text-[#D99789]'}`}>
            {showLabels ? '✓ ' : ''}{lang === 'pt-BR' ? 'Rótulos' : 'Labels'}
          </button>
        </div>
      </div>

      {chartType === 'bar' ? (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data} margin={{ top: 20, right: 60, bottom: 35, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} />
            <XAxis dataKey="label" tick={{ fill: SALMON, fontSize: 10 }} tickLine={false} label={{ value: grpLabel, position: 'insideBottom', offset: -20, fill: SALMON, fontSize: 11 }} />
            <YAxis tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: axisLabel, angle: -90, position: 'insideLeft', fill: SALMON, fontSize: 11 }} />
            <Tooltip {...TT} formatter={v => [v, axisLabel]} />
            <ReferenceLine y={avg} stroke={NAVY} strokeWidth={2} strokeDasharray="5 5" label={{ value: `avg: ${avg}`, fill: NAVY, fontSize: 10, position: 'insideTopRight', fontWeight: 700 }} />
            {allTypes.length > 1 ? (
              allTypes.map((type, idx) => (
                <Bar key={type} dataKey={type} stackId="a" fill={STATUS_COLORS[idx % STATUS_COLORS.length]} radius={idx === allTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={40}>
                  {showLabels && idx === allTypes.length - 1 && <LabelList dataKey="count" position="top" style={{ fill: NAVY, fontSize: 10, fontWeight: 700 }} />}
                </Bar>
              ))
            ) : (
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name={axisLabel} maxBarSize={40} fill={TERRA}>
                {data.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                {showLabels && <LabelList dataKey="count" position="top" style={{ fill: NAVY, fontSize: 10, fontWeight: 700 }} />}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div>
          <p className="text-xs text-[#D99789] mb-2 text-center">{lang === 'pt-BR' ? `Agrupado por faixas de volume (${grpLabel})` : `Grouped by volume ranges (${grpLabel})`}</p>
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={140} innerRadius={70} label={false}>
                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip {...TT} formatter={v => [v, axisLabel]} />
              <Legend wrapperStyle={{ color: NAVY, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {trendInsight && (
        <div className="mt-3 p-3 bg-[#F2C5BB]/20 border border-[#F2C5BB] rounded-xl text-xs text-[#092140]">{trendInsight}</div>
      )}
    </div>
  )
}

// ─── THROUGHPUT HISTOGRAM ────────────────────────────────────────────────────
export function ThroughputHistogramChart({ items }: { items: WorkItem[] }) {
  const { t, lang } = useApp()
  const [showLabels, setShowLabels] = useState(false)
  const [excludeZeros, setExcludeZeros] = useState(false)

  const { data, median, mean, mode, p50, p70, p85 } = useMemo(() => {
    const weekMap = new Map<string, number>()
    items.filter(i => i.exitDate).forEach(i => { const k = getGroupKey(i.exitDate!, 'week'); weekMap.set(k, (weekMap.get(k) ?? 0) + 1) })
    let values = [...weekMap.values()].sort((a, b) => a - b)
    if (excludeZeros) values = values.filter(v => v > 0)
    if (!values.length) return { data: [], median: 0, mean: 0, mode: 0, p50: 0, p70: 0, p85: 0 }
    const med = getPercentile(values, 50)
    const p70v = getPercentile(values, 70)
    const p85v = getPercentile(values, 85)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const freq = new Map<number, number>()
    values.forEach(v => freq.set(v, (freq.get(v) ?? 0) + 1))
    const modeVal = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
    const max = Math.max(...values)
    const binSize = Math.max(1, Math.ceil(max / 15))
    const bins = new Map<number, number>()
    values.forEach(v => { const bin = Math.floor(v / binSize) * binSize; bins.set(bin, (bins.get(bin) ?? 0) + 1) })
    return {
      data: Array.from(bins.entries()).sort(([a], [b]) => a - b).map(([bin, count]) => ({ bin: `${bin}–${bin + binSize - 1}`, count })),
      median: med, mean: avg, mode: modeVal, p50: med, p70: p70v, p85: p85v,
    }
  }, [items, excludeZeros])

  const axisLabel = lang === 'pt-BR' ? 'itens/semana' : 'items/week'
  const countLabel = lang === 'pt-BR' ? 'semanas' : 'weeks'

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[{ label: 'P50', value: p50, color: GREEN }, { label: 'P70', value: p70, color: YELLOW }, { label: 'P85', value: p85, color: TERRA }].map(p => (
            <div key={p.label} className="rounded-xl px-3 py-2 text-center border" style={{ borderColor: p.color, backgroundColor: p.color + '15' }}>
              <p className="text-xs font-bold" style={{ color: p.color }}>{p.label}</p>
              <p className="text-[#092140] font-bold text-sm">{p.value}</p>
            </div>
          ))}
          <div className="bg-[#F2C5BB]/30 border border-[#D99789] rounded-xl px-3 py-2 text-center">
            <p className="text-xs font-bold text-[#D99789]">{t.median}</p>
            <p className="text-[#092140] font-bold text-sm">{median}</p>
          </div>
          <div className="bg-[#F2C5BB]/30 border border-[#D99789] rounded-xl px-3 py-2 text-center">
            <p className="text-xs font-bold text-[#D99789]">{t.mean}</p>
            <p className="text-[#092140] font-bold text-sm">{mean}</p>
          </div>
          <div className="bg-[#F2C5BB]/30 border border-[#D99789] rounded-xl px-3 py-2 text-center">
            <p className="text-xs font-bold text-[#D99789]">{t.mode}</p>
            <p className="text-[#092140] font-bold text-sm">{mode}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setExcludeZeros(l => !l)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${excludeZeros ? 'bg-[#092140] text-white border-[#092140]' : 'border-[#D99789] text-[#D99789]'}`}>
            {excludeZeros ? '✓ ' : ''}{lang === 'pt-BR' ? 'Excluir zeros' : 'Exclude zeros'}
          </button>
          <button onClick={() => setShowLabels(l => !l)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showLabels ? 'bg-[#BF452A] text-white border-[#BF452A]' : 'border-[#D99789] text-[#D99789]'}`}>
            {showLabels ? '✓ ' : ''}{lang === 'pt-BR' ? 'Rótulos' : 'Labels'}
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, bottom: 45, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={LIGHT} />
          <XAxis dataKey="bin" tick={{ fill: SALMON, fontSize: 10 }} tickLine={false} interval={0} angle={data.length > 8 ? -30 : 0} textAnchor={data.length > 8 ? 'end' : 'middle'} height={data.length > 8 ? 50 : 30} label={{ value: axisLabel, position: 'insideBottom', offset: data.length > 8 ? -35 : -20, fill: SALMON, fontSize: 11 }} />
          <YAxis tick={{ fill: SALMON, fontSize: 11 }} tickLine={false} label={{ value: countLabel, angle: -90, position: 'insideLeft', fill: SALMON, fontSize: 11 }} />
          <Tooltip {...TT} formatter={v => [v, countLabel]} />
          <Bar dataKey="count" fill={NAVY} fillOpacity={0.85} radius={[4, 4, 0, 0]} name={countLabel}>
            {showLabels && <LabelList dataKey="count" position="top" style={{ fill: NAVY, fontSize: 11, fontWeight: 700 }} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-[#D99789] text-center mt-2">{lang === 'pt-BR' ? 'Baseado em semanas — unidade padrão para análise de distribuição de throughput' : 'Based on weeks — standard unit for throughput distribution analysis'}</p>
    </div>
  )
}
