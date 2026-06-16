import { useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
  AreaChart, Area, Legend,
} from 'recharts'
import type { WorkItem, GroupBy } from '../../types'
import { getPercentile, getGroupKey, getGroupLabel, getDatasetMaxDate } from '../../lib/mapping'

interface Props { items: WorkItem[]; groupBy: GroupBy; excludeZeroCT?: boolean }

const C = { navy: '#092140', terra: '#BF452A', salmon: '#D99789', blush: '#F2C5BB' }

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
      <BreakdownChart items={concludedFiltered} />
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

function ScatterplotChart({ items }: { items: WorkItem[]; groupBy: GroupBy }) {
  const sorted = items.map(i => i.cycleTime!).sort((a, b) => a - b)
  const p50 = getPercentile(sorted, 50)
  const p85 = getPercentile(sorted, 85)
  const p95 = getPercentile(sorted, 95)
  const data = items.map(i => ({ x: i.exitDate!.getTime(), y: i.cycleTime!, id: i.id }))
  return (
    <Card title="Cycle Time Scatterplot" desc="Distribuição do Cycle Time por item concluído.">
      {items.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis dataKey="x" type="number" domain={['auto','auto']} tick={{ fontSize: 10, fill: C.salmon }}
              tickFormatter={v => new Date(v).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })} />
            <YAxis dataKey="y" tick={{ fontSize: 11, fill: C.salmon }} unit="d" />
            <Tooltip content={({ payload }) => {
              if (!payload?.length) return null
              const d = payload[0].payload
              return <div className="bg-white border border-[#F2C5BB] px-3 py-2 rounded shadow text-xs"><div>ID: {d.id}</div><div>CT: {d.y}d</div><div>{new Date(d.x).toLocaleDateString('pt-BR')}</div></div>
            }} />
            <ReferenceLine y={p50} stroke={C.terra} strokeDasharray="4 2" label={{ value: `P50:${p50}d`, fill: C.terra, fontSize: 10 }} />
            <ReferenceLine y={p85} stroke={C.salmon} strokeDasharray="4 2" label={{ value: `P85:${p85}d`, fill: C.salmon, fontSize: 10 }} />
            <ReferenceLine y={p95} stroke={C.navy} strokeDasharray="4 2" label={{ value: `P95:${p95}d`, fill: C.navy, fontSize: 10 }} />
            <Scatter data={data} fill={C.terra} fillOpacity={0.6} r={3} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

function ThroughputRunChart({ items, groupBy }: { items: WorkItem[]; groupBy: GroupBy }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      const key = getGroupKey(item.exitDate!, groupBy)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([key, count]) => ({ key, count }))
  }, [items, groupBy])
  return (
    <Card title="Throughput Run Chart" desc={`Itens concluídos por ${getGroupLabel(groupBy, 'pt-BR')}.`}>
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis dataKey="key" tick={{ fontSize: 10, fill: C.salmon }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: C.salmon }} />
            <Tooltip formatter={(v) => [v, 'itens']} />
            <Bar dataKey="count" fill={C.terra} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

function AgingChart({ items, allItems }: { items: WorkItem[]; allItems: WorkItem[] }) {
  const refDate = getDatasetMaxDate(allItems)
  const data = items.map(i => ({
    id: i.id,
    status: i.currentStatus ?? 'Unknown',
    age: Math.round((refDate.getTime() - i.entryDate.getTime()) / (1000 * 60 * 60 * 24)),
  }))
  const ages = data.map(d => d.age).sort((a,b) => a - b)
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
              return <div className="bg-white border border-[#F2C5BB] px-3 py-2 rounded shadow text-xs"><div>ID: {d.id}</div><div>Status: {d.status}</div><div>Idade: {d.age}d</div></div>
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
    return [...counts.entries()].sort(([a],[b]) => a - b).map(([s, count]) => ({ label: `${s}-${s+bucket}d`, count }))
  }, [items])
  return (
    <Card title="Histograma CT" desc="Frequência de cada faixa de Cycle Time.">
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.salmon }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: C.salmon }} />
            <Tooltip formatter={(v) => [v, 'itens']} />
            <Bar dataKey="count" fill={C.navy} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

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
    return [...byPeriod.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([key, counts]) => {
      const row: Record<string, unknown> = { key }
      for (const s of statuses) row[s] = counts.get(s) ?? 0
      return row
    })
  }, [items, groupBy, statuses])
  const palette = [C.navy, C.terra, C.salmon, C.blush, '#6B7280', '#10B981', '#8B5CF6']
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
                stroke={palette[i % palette.length]} fill={palette[i % palette.length]} fillOpacity={0.7} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

function BreakdownChart({ items }: { items: WorkItem[] }) {
  const data = useMemo(() => {
    const totals = new Map<string, { sum: number; count: number }>()
    for (const item of items) {
      if (item.cycleTime === undefined || !item.currentStatus) continue
      const s = item.currentStatus
      const cur = totals.get(s) ?? { sum: 0, count: 0 }
      totals.set(s, { sum: cur.sum + item.cycleTime, count: cur.count + 1 })
    }
    return [...totals.entries()]
      .map(([status, { sum, count }]) => ({ status, avg: Math.round(sum / count) }))
      .sort((a, b) => b.avg - a.avg)
  }, [items])
  return (
    <Card title="Stage Breakdown" desc="Tempo médio por status nos itens concluídos.">
      {data.length === 0 ? <Empty /> : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 40, bottom: 10, left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.blush} />
            <XAxis type="number" tick={{ fontSize: 11, fill: C.salmon }} unit="d" />
            <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: C.navy }} width={95} />
            <Tooltip formatter={(v) => [`${v} dias`, 'Média']} />
            <Bar dataKey="avg" fill={C.terra} radius={[0,3,3,0]}
              label={{ position: 'right', fontSize: 10, fill: C.navy, formatter: (v: unknown) => `${v}d` }} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
