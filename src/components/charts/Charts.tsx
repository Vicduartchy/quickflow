import { useMemo, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, LabelList,
  AreaChart, Area, Legend, PieChart, Pie, Cell,
} from 'recharts'
import type { WorkItem, GroupBy } from '../../types'
import { getPercentile, getGroupKey, getGroupLabel, getDatasetMaxDate } from '../../lib/mapping'

interface Props { items: WorkItem[]; groupBy: GroupBy; excludeZeroCT?: boolean }

const C = { navy: '#092140', terra: '#BF452A', salmon: '#D99789', blush: '#F2C5BB' }

const PALETTE = [
  C.terra, C.navy, C.salmon, '#6B7280', '#10B981', '#8B5CF6', '#F59E0B',
  '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
]

export default function Charts({ items, groupBy, excludeZeroCT }: Props) {
  const concluded = items.filter(i => i.cycleTime !== undefined)
  const concludedFiltered = excludeZeroCT ? concluded.filter(i => i.cycleTime! > 0) : concluded
  const wip = items.filter(i => i.cycleTime === undefined)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ScatterplotChart items={concludedFiltered} groupBy={groupBy} />
      <ThroughputRunChart items={concludedFiltered} groupBy={groupBy} />
      <AgingChart items={wip} allItems={items} />
      <HistogramChart items={concludedFiltered} />
      <CFDChart items={items} groupBy={groupBy} />
      <BreakdownChart items={items} />
    </div>
  )
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#F2C5BB] shadow-sm p-5">
      <h3 className="font-bold text-[#092140] mb-1">{title}</h3>
      <p className="text-[#D99789] text-xs mb-4">{desc}</p>
      {children}
    </div>
  )
}

function Empty({ msg }: { msg?: string }) {
  return <div className="h-64 flex items-center justify-center text-[#D99789] text-sm">{msg ?? 'Sem dados suficientes.'}</div>
}

// ─── Scatterplot com percentis fora da área do gráfico ───────────────────────

function ScatterplotChart({ items }: { items: WorkItem[]; groupBy: GroupBy }) {
  const sorted = items.map(i => i.cycleTime!).sort((a, b) => a - b)
  const p50 = getPercentile(sorted, 50)
  const p85 = getPercentile(sorted, 85)
  const p95 = getPercentile(sorted, 95)
  const data = items.map(i => ({ x: i.exitDate!.getTime(), y: i.cycleTime!, id: i.id }))

  return (
    <Card title="Cycle Time Scatterplot" desc="Distribuição do Cycle Time por item concluído.">
      {items.length === 0 ? <Empty /> : (
        <>
          {/* Legenda dos percentis acima do gráfico */}
          <div className="flex gap-4 mb-3 flex-wrap">
            {[
              { label: 'P50', value: p50, color: C.terra },
              { label: 'P85', value: p85, color: C.salmon },
              { label: 'P95', value: p95, color: C.navy },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: color }} />
                <span className="text-xs font-semibold" style={{ color }}>{label}: {value}d</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
              <XAxis dataKey="x" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: C.salmon }}
                tickFormatter={v => new Date(v).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })} />
              <YAxis dataKey="y" tick={{ fontSize: 11, fill: C.salmon }} unit="d" />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-white border border-[#F2C5BB] px-3 py-2 rounded shadow text-xs">
                    <div>ID: {d.id}</div><div>CT: {d.y}d</div><div>{new Date(d.x).toLocaleDateString('pt-BR')}</div>
                  </div>
                )
              }} />
              <ReferenceLine y={p50} stroke={C.terra} strokeDasharray="4 2" />
              <ReferenceLine y={p85} stroke={C.salmon} strokeDasharray="4 2" />
              <ReferenceLine y={p95} stroke={C.navy} strokeDasharray="4 2" />
              <Scatter data={data} fill={C.terra} fillOpacity={0.6} r={3} />
            </ScatterChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  )
}

// ─── Throughput Run Chart com rótulos nas barras ──────────────────────────────

function ThroughputRunChart({ items, groupBy }: { items: WorkItem[]; groupBy: GroupBy }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      const key = getGroupKey(item.exitDate!, groupBy)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => ({ key, count }))
  }, [items, groupBy])

  // Só exibe rótulos se não houver muitas barras (evita poluição visual)
  const showLabels = data.length <= 24

  return (
    <Card title="Throughput Run Chart" desc={`Itens concluídos por ${getGroupLabel(groupBy, 'pt-BR')}.`}>
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: showLabels ? 20 : 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis dataKey="key" tick={{ fontSize: 10, fill: C.salmon }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: C.salmon }} />
            <Tooltip formatter={(v) => [v, 'itens']} />
            <Bar dataKey="count" fill={C.terra} radius={[3, 3, 0, 0]}>
              {showLabels && (
                <LabelList dataKey="count" position="top" style={{ fontSize: 9, fill: C.navy, fontWeight: 600 }} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── Aging Chart ──────────────────────────────────────────────────────────────

function AgingChart({ items, allItems }: { items: WorkItem[]; allItems: WorkItem[] }) {
  const refDate = getDatasetMaxDate(allItems)
  const data = items.map(i => ({
    id: i.id,
    status: i.currentStatus ?? 'Unknown',
    age: Math.round((refDate.getTime() - i.entryDate.getTime()) / (1000 * 60 * 60 * 24)),
  }))
  const ages = data.map(d => d.age).sort((a, b) => a - b)
  const p85 = getPercentile(ages, 85)
  const p95 = getPercentile(ages, 95)
  return (
    <Card title="Aging Chart" desc="Tempo em andamento dos itens WIP.">
      {data.length === 0 ? <Empty msg="Nenhum item em andamento." /> : (
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis dataKey="age" type="number" tick={{ fontSize: 11, fill: C.salmon }} unit="d" />
            <YAxis dataKey="status" type="category" tick={{ fontSize: 10, fill: C.navy }} width={100} />
            <Tooltip content={({ payload }) => {
              if (!payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-white border border-[#F2C5BB] px-3 py-2 rounded shadow text-xs">
                  <div>ID: {d.id}</div><div>Status: {d.status}</div><div>Idade: {d.age}d</div>
                </div>
              )
            }} />
            <ReferenceLine x={p85} stroke={C.salmon} strokeDasharray="4 2" label={{ value: `P85:${p85}d`, fill: C.salmon, fontSize: 10 }} />
            <ReferenceLine x={p95} stroke={C.terra} strokeDasharray="4 2" label={{ value: `P95:${p95}d`, fill: C.terra, fontSize: 10 }} />
            <Scatter data={data} fill={C.navy} fillOpacity={0.7} r={4} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── Histograma CT com rótulos nas barras ─────────────────────────────────────

function HistogramChart({ items }: { items: WorkItem[] }) {
  const data = useMemo(() => {
    if (items.length === 0) return []
    const max = Math.max(...items.map(i => i.cycleTime!))
    const bucket = Math.max(1, Math.round(max / 20))
    const counts = new Map<number, number>()
    for (const item of items) {
      const b = Math.floor(item.cycleTime! / bucket) * bucket
      counts.set(b, (counts.get(b) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a - b).map(([s, count]) => ({ label: `${s}-${s + bucket}d`, count }))
  }, [items])

  const showLabels = data.length <= 20

  return (
    <Card title="Histograma CT" desc="Frequência de cada faixa de Cycle Time.">
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: showLabels ? 20 : 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.salmon }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: C.salmon }} />
            <Tooltip formatter={(v) => [v, 'itens']} />
            <Bar dataKey="count" fill={C.navy} radius={[3, 3, 0, 0]}>
              {showLabels && (
                <LabelList dataKey="count" position="top" style={{ fontSize: 9, fill: C.navy, fontWeight: 600 }} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── CFD Chart ────────────────────────────────────────────────────────────────

function CFDChart({ items, groupBy }: { items: WorkItem[]; groupBy: GroupBy }) {
  const statuses = useMemo(() => [...new Set(items.map(i => i.currentStatus).filter(Boolean) as string[])], [items])
  const data = useMemo(() => {
    const byPeriod = new Map<string, Map<string, number>>()
    for (const item of items) {
      const key = getGroupKey(item.entryDate, groupBy)
      if (!byPeriod.has(key)) byPeriod.set(key, new Map())
      const s = item.currentStatus ?? 'Unknown'
      byPeriod.get(key)!.set(s, (byPeriod.get(key)!.get(s) ?? 0) + 1)
    }
    return [...byPeriod.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, counts]) => {
      const row: Record<string, unknown> = { key }
      for (const s of statuses) row[s] = counts.get(s) ?? 0
      return row
    })
  }, [items, groupBy, statuses])

  return (
    <Card title="Cumulative Flow Diagram" desc="Evolução dos itens em cada status ao longo do tempo.">
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis dataKey="key" tick={{ fontSize: 10, fill: C.salmon }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: C.salmon }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {statuses.map((s, i) => (
              <Area key={s} type="monotone" dataKey={s} stackId="1"
                stroke={PALETTE[i % PALETTE.length]} fill={PALETTE[i % PALETTE.length]} fillOpacity={0.7} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

// ─── Stage Breakdown — todos os states, toggle barra/pizza ───────────────────

type BreakdownMode = 'bar' | 'pie'

function BreakdownChart({ items }: { items: WorkItem[] }) {
  const [mode, setMode] = useState<BreakdownMode>('bar')

  // Considera TODOS os itens (concluídos e WIP) agrupados por status
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      const s = item.currentStatus ?? 'Unknown'
      counts.set(s, (counts.get(s) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
  }, [items])

  const total = data.reduce((acc, d) => acc + d.count, 0)

  return (
    <Card
      title="Stage Breakdown"
      desc="Distribuição de itens por status (todos os estados)."
    >
      {/* Toggle barra / pizza */}
      <div className="flex gap-2 mb-4">
        {(['bar', 'pie'] as BreakdownMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-[#BF452A] text-white'
                : 'bg-[#F2F2F2] text-[#092140] hover:bg-[#F2C5BB]'
            }`}
          >
            {m === 'bar' ? 'Barras' : 'Pizza'}
          </button>
        ))}
      </div>

      {data.length === 0 ? <Empty /> : mode === 'bar' ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, bottom: 5, left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis type="number" tick={{ fontSize: 11, fill: C.salmon }} />
            <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: C.navy }} width={95} />
            <Tooltip formatter={(v) => [`${v} itens`, 'Total']} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
              <LabelList dataKey="count" position="right" style={{ fontSize: 10, fill: C.navy, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${(((value ?? 0) / total) * 100).toFixed(1)}%`}
              labelLine={true}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} itens`, 'Total']} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
