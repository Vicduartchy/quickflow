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

// ─── Card com explicação colapsável ──────────────────────────────────────────

function Card({
  title, desc, explanation, children,
}: {
  title: string
  desc: string
  explanation: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-[#F2C5BB] shadow-sm p-5">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bold text-[#092140]">{title}</h3>
        <button
          onClick={() => setOpen(o => !o)}
          title="Como ler este gráfico"
          className="ml-2 shrink-0 w-5 h-5 rounded-full border border-[#D99789] text-[#D99789] hover:bg-[#F2C5BB] hover:text-[#092140] flex items-center justify-center text-xs font-bold transition-colors"
        >
          ?
        </button>
      </div>
      <p className="text-[#D99789] text-xs mb-2">{desc}</p>
      {open && (
        <div className="mb-4 bg-[#F9F4F2] border border-[#F2C5BB] rounded-lg px-4 py-3 text-xs text-[#092140] leading-relaxed">
          {explanation}
        </div>
      )}
      {!open && <div className="mb-2" />}
      {children}
    </div>
  )
}

function Empty({ msg }: { msg?: string }) {
  return <div className="h-64 flex items-center justify-center text-[#D99789] text-sm">{msg ?? 'Sem dados suficientes.'}</div>
}

// ─── Scatterplot ──────────────────────────────────────────────────────────────

function ScatterplotChart({ items }: { items: WorkItem[]; groupBy: GroupBy }) {
  const sorted = items.map(i => i.cycleTime!).sort((a, b) => a - b)
  const p50 = getPercentile(sorted, 50)
  const p85 = getPercentile(sorted, 85)
  const p95 = getPercentile(sorted, 95)
  const data = items.map(i => ({ x: i.exitDate!.getTime(), y: i.cycleTime!, id: i.id }))

  const explanation =
    'Cada ponto representa um item entregue. O eixo horizontal mostra quando foi concluído e o eixo vertical mostra quantos dias levou (Cycle Time). ' +
    'Quanto mais alto o ponto, mais tempo o item ficou em andamento. ' +
    'As linhas tracejadas são os percentis: P50 significa que metade dos itens foi entregue em até esse tempo; P85 e P95 mostram os limites para 85% e 95% dos itens, respectivamente. ' +
    'Use o P85 como referência para dar previsões de prazo com alta confiança — ao prometer uma entrega, diga que ela ocorrerá em até P85 dias.'

  return (
    <Card title="Cycle Time Scatterplot" desc="Distribuição do Cycle Time por item concluído." explanation={explanation}>
      {items.length === 0 ? <Empty /> : (
        <>
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

// ─── Throughput Run Chart ─────────────────────────────────────────────────────

function ThroughputRunChart({ items, groupBy }: { items: WorkItem[]; groupBy: GroupBy }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      const key = getGroupKey(item.exitDate!, groupBy)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => ({ key, count }))
  }, [items, groupBy])

  const showLabels = data.length <= 24

  const label = getGroupLabel(groupBy, 'pt-BR')
  const explanation =
    `Cada barra mostra quantos itens o time entregou em uma ${label}. ` +
    'Barras altas indicam períodos de alta produtividade; barras baixas podem sinalizar impedimentos, feriados ou acúmulo de trabalho não entregue. ' +
    'Observe a consistência: um time saudável tende a ter barras com alturas parecidas ao longo do tempo. ' +
    'Variações bruscas merecem investigação — tanto picos (possível entrega em lote) quanto quedas (possível bloqueio ou sobrecarga).'

  return (
    <Card title="Throughput Run Chart" desc={`Itens concluídos por ${label}.`} explanation={explanation}>
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

  const explanation =
    'Mostra os itens que ainda estão em andamento (WIP) e há quantos dias cada um está no fluxo. ' +
    'O eixo horizontal é a idade do item em dias; o eixo vertical é o status atual. ' +
    'Pontos além da linha P85 estão envelhecendo mais do que 85% dos itens já entregues — são candidatos prioritários para desbloqueio. ' +
    'Pontos além do P95 representam anomalias graves e devem ser tratados com urgência. ' +
    'Concentrações de pontos em um mesmo status indicam gargalos naquela etapa do fluxo.'

  return (
    <Card title="Aging Chart" desc="Tempo em andamento dos itens WIP." explanation={explanation}>
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

// ─── Histograma CT ────────────────────────────────────────────────────────────

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

  const explanation =
    'Agrupa os itens entregues por faixas de Cycle Time e mostra quantos itens caem em cada faixa. ' +
    'A barra mais alta revela a faixa de tempo mais comum para entregas — o "ritmo natural" do time. ' +
    'Uma distribuição concentrada à esquerda (poucos dias) indica um fluxo ágil e previsível. ' +
    'Uma distribuição espalhada ou com cauda longa à direita indica alta variabilidade — o time entrega itens com tempos muito diferentes, o que dificulta previsões. ' +
    'Barras isoladas à direita podem ser itens problemáticos que merecem análise individual.'

  return (
    <Card title="Histograma CT" desc="Frequência de cada faixa de Cycle Time." explanation={explanation}>
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

  const explanation =
    'Mostra como os itens se distribuem entre os status ao longo do tempo. ' +
    'Cada cor representa um status; a altura total da pilha é o volume total de itens naquele período. ' +
    'Um fluxo saudável tem as camadas crescendo de forma proporcional e estável. ' +
    'Se uma camada (especialmente WIP ou status intermediários) crescer muito mais do que as outras, há acúmulo — sinal de gargalo. ' +
    'Se a camada "Concluído" parar de crescer enquanto as demais aumentam, o fluxo está represado.'

  return (
    <Card title="Cumulative Flow Diagram" desc="Evolução dos itens em cada status ao longo do tempo." explanation={explanation}>
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

// ─── Stage Breakdown ─────────────────────────────────────────────────────────

type BreakdownMode = 'bar' | 'pie'

function BreakdownChart({ items }: { items: WorkItem[] }) {
  const [mode, setMode] = useState<BreakdownMode>('bar')

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

  const explanation =
    'Mostra quantos itens estão em cada status no momento atual. ' +
    'No modo barras, é fácil comparar os volumes entre os status. No modo pizza, vê-se a proporção de cada um sobre o total. ' +
    'Um status com volume muito alto em relação aos demais pode indicar um gargalo ou ponto de acúmulo no fluxo. ' +
    'Idealmente, a maior fatia deve ser o status final (Concluído/Done). ' +
    'Se os status intermediários concentrarem a maior parte dos itens, o time está acumulando trabalho em progresso — o que aumenta o Cycle Time.'

  return (
    <Card
      title="Stage Breakdown"
      desc="Distribuição de itens por status (todos os estados)."
      explanation={explanation}
    >
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
