import { useMemo } from 'react'
import type { WorkItem, GroupBy } from '../types'
import { getPercentile, getGroupKey, computeThroughputMedian } from '../lib/mapping'

interface Props {
  items: WorkItem[]
  groupBy: GroupBy
  excludeZeroCT: boolean
}

interface Insight {
  type: 'warning' | 'success' | 'info'
  title: string
  body: string
}

function generateInsights(items: WorkItem[], groupBy: GroupBy, excludeZeroCT: boolean): Insight[] {
  const insights: Insight[] = []
  if (items.length === 0) return insights

  const concluded = items.filter(i => i.cycleTime !== undefined)
  const concludedFiltered = excludeZeroCT ? concluded.filter(i => i.cycleTime! > 0) : concluded
  const wip = items.filter(i => i.cycleTime === undefined)

  if (concludedFiltered.length === 0) return insights

  // ── Cycle Time ──────────────────────────────────────────────────────────────
  const ctSorted = concludedFiltered.map(i => i.cycleTime!).sort((a, b) => a - b)
  const p50 = getPercentile(ctSorted, 50)
  const p85 = getPercentile(ctSorted, 85)
  const p95 = getPercentile(ctSorted, 95)
  const spreadRatio = p85 > 0 ? p95 / p85 : 0

  // Variabilidade do CT
  if (spreadRatio > 2.5) {
    insights.push({
      type: 'warning',
      title: 'Alta variabilidade no Cycle Time',
      body: `O P95 (${p95}d) é mais de ${spreadRatio.toFixed(1)}× maior que o P85 (${p85}d). Isso indica que uma parcela dos itens demora muito mais do que o padrão do time — possivelmente por escopo mal definido, dependências externas ou bloqueios recorrentes. Recomenda-se investigar os itens acima do P85 para identificar padrões.`,
    })
  } else if (spreadRatio > 0 && spreadRatio <= 1.5) {
    insights.push({
      type: 'success',
      title: 'Cycle Time previsível',
      body: `A diferença entre P85 (${p85}d) e P95 (${p95}d) é pequena, o que indica um fluxo consistente. O time consegue entregar a maioria dos itens em um intervalo de tempo estável — boa base para previsões de prazo confiáveis.`,
    })
  }

  // CT muito alto em absoluto (mais de 30 dias no P50)
  if (p50 > 30) {
    insights.push({
      type: 'warning',
      title: 'Cycle Time mediano elevado',
      body: `Metade dos itens leva mais de ${p50} dias para ser entregue. Cycle Times altos geralmente indicam excesso de WIP, itens muito grandes ou etapas de espera longas no fluxo. Considere limitar o WIP e dividir itens grandes em entregas menores.`,
    })
  } else if (p50 <= 7) {
    insights.push({
      type: 'success',
      title: 'Cycle Time mediano saudável',
      body: `Com P50 de ${p50} dias, o time entrega metade dos itens em menos de uma semana. Isso é um sinal de fluxo ágil e itens bem dimensionados.`,
    })
  }

  // ── Throughput ──────────────────────────────────────────────────────────────
  const { median: tpMedian } = computeThroughputMedian(items, groupBy)

  // Variação do throughput
  const tpCounts = new Map<string, number>()
  for (const item of concludedFiltered) {
    const key = getGroupKey(item.exitDate!, groupBy)
    tpCounts.set(key, (tpCounts.get(key) ?? 0) + 1)
  }
  const tpValues = [...tpCounts.values()]
  if (tpValues.length >= 4) {
    const tpSorted = [...tpValues].sort((a, b) => a - b)
    const tpP25 = getPercentile(tpSorted, 25)
    const tpP75 = getPercentile(tpSorted, 75)
    const iqr = tpP75 - tpP25
    const tpVariability = tpMedian > 0 ? iqr / tpMedian : 0

    if (tpVariability > 0.6) {
      insights.push({
        type: 'warning',
        title: 'Throughput instável',
        body: `A variação entre os períodos de maior e menor entrega é alta (IQR de ${iqr} itens sobre uma mediana de ${tpMedian}). Throughput instável dificulta planejamento e pode indicar entregas em lote, sprints mal calibrados ou dependências entre itens. Buscar um fluxo mais contínuo tende a reduzir essa variação.`,
      })
    } else if (tpVariability <= 0.3) {
      insights.push({
        type: 'success',
        title: 'Throughput consistente',
        body: `O volume de entregas por período é estável, com baixa variação em torno da mediana de ${tpMedian} itens. Isso facilita previsões de capacidade e planejamento de roadmap.`,
      })
    }
  }

  // ── WIP ─────────────────────────────────────────────────────────────────────
  const wipRatio = items.length > 0 ? wip.length / items.length : 0

  if (wipRatio > 0.5) {
    insights.push({
      type: 'warning',
      title: 'Work in Progress (WIP) elevado em relação ao total',
      body: `${wip.length} de ${items.length} itens (${(wipRatio * 100).toFixed(0)}%) ainda estão em andamento. Um Work in Progress (WIP) alto aumenta o Cycle Time e reduz o foco do time. Pela Lei de Little, reduzir o WIP é a forma mais direta de acelerar as entregas sem aumentar a equipe.`,
    })
  }

  // Itens envelhecendo além do P95 de CT
  if (wip.length > 0 && p95 > 0) {
    const refDate = new Date(Math.max(...items.map(i => i.exitDate?.getTime() ?? i.entryDate.getTime())))
    const oldWip = wip.filter(i => {
      const age = Math.round((refDate.getTime() - i.entryDate.getTime()) / (1000 * 60 * 60 * 24))
      return age > p95
    })
    if (oldWip.length > 0) {
      insights.push({
        type: 'warning',
        title: `${oldWip.length} ${oldWip.length === 1 ? 'item' : 'itens'} em andamento além do P95`,
        body: `${oldWip.length === 1 ? 'Um item está' : `${oldWip.length} itens estão`} em andamento há mais de ${p95} dias — acima do P95 de Cycle Time dos itens já entregues. Esses itens provavelmente estão bloqueados ou foram esquecidos no fluxo. Recomenda-se revisão imediata em reunião de gestão de fluxo.`,
      })
    }
  }

  // ── Itens com CT = 0 ────────────────────────────────────────────────────────
  const zeroCT = concluded.filter(i => i.cycleTime === 0)
  const zeroPct = concluded.length > 0 ? (zeroCT.length / concluded.length) * 100 : 0
  if (zeroPct > 15) {
    insights.push({
      type: 'info',
      title: `${zeroPct.toFixed(0)}% dos itens têm Cycle Time zero`,
      body: `${zeroCT.length} itens foram concluídos no mesmo dia em que foram criados. Isso pode indicar migrações de dados, itens criados retroativamente ou tarefas muito pequenas. Ative o filtro "Excluir Cycle Time = 0" para analisar o fluxo real sem esses itens.`,
    })
  }

  // ── Gargalo por status ───────────────────────────────────────────────────────
  const statusCounts = new Map<string, number>()
  for (const item of wip) {
    const s = item.currentStatus ?? 'Unknown'
    statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1)
  }
  if (statusCounts.size > 0) {
    const sorted = [...statusCounts.entries()].sort((a, b) => b[1] - a[1])
    const [topStatus, topCount] = sorted[0]
    const topPct = wip.length > 0 ? (topCount / wip.length) * 100 : 0
    if (topPct > 40 && wip.length > 5) {
      insights.push({
        type: 'warning',
        title: `Possível gargalo em "${topStatus}"`,
        body: `${topCount} dos ${wip.length} itens em andamento (${topPct.toFixed(0)}%) estão concentrados no status "${topStatus}". Uma concentração tão alta em um único estágio é um sinal claro de gargalo. Verifique se há limite de WIP definido para essa etapa e se o time tem capacidade para processar os itens acumulados.`,
      })
    }
  }

  return insights
}

const ICON: Record<Insight['type'], string> = {
  warning: '⚠️',
  success: '✅',
  info: 'ℹ️',
}

const STYLE: Record<Insight['type'], string> = {
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
}

const TITLE_STYLE: Record<Insight['type'], string> = {
  warning: 'text-amber-800',
  success: 'text-emerald-800',
  info: 'text-blue-800',
}

export default function InsightsPanel({ items, groupBy, excludeZeroCT }: Props) {
  const insights = useMemo(
    () => generateInsights(items, groupBy, excludeZeroCT),
    [items, groupBy, excludeZeroCT],
  )

  if (insights.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="font-bold text-[#092140] text-sm mb-3 flex items-center gap-2">
        <span className="text-base">🔍</span> Insights de Gestão de Fluxo
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`border rounded-xl px-4 py-3 text-xs leading-relaxed ${STYLE[insight.type]}`}
          >
            <div className={`font-bold mb-1 flex items-center gap-1.5 ${TITLE_STYLE[insight.type]}`}>
              <span>{ICON[insight.type]}</span>
              <span>{insight.title}</span>
            </div>
            <p>{insight.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
