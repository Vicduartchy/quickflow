import { useMemo } from 'react'
import type { WorkItem, GroupBy } from '../types'
import { getPercentile, getGroupKey, computeThroughputMedian } from '../lib/mapping'
import { IconWarning, IconCheck, IconInfo, IconSearch } from './Icons'

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
      title: 'Alta variabilidade no Cycle Time (Cauda Longa)',
      body: `O P95 (${p95}d) é ${spreadRatio.toFixed(1)}× maior que o P85 (${p85}d). No Método Kanban, essa "cauda longa" indica imprevisibilidade sistêmica — causada por dependências não gerenciadas, bloqueios invisíveis ou ausência de políticas explícitas de priorização (Classes de Serviço). Investigue os itens da cauda para criar políticas de mitigação.`,
    })
  } else if (spreadRatio > 0 && spreadRatio <= 1.5) {
    insights.push({
      type: 'success',
      title: 'Previsibilidade de Serviço (SLA)',
      body: `A diferença entre P85 (${p85}d) e P95 (${p95}d) é pequena, indicando maturidade no fluxo. O sistema está sob controle e a variabilidade é gerenciada, permitindo que o time estabeleça Acordos de Nível de Serviço (SLAs) altamente confiáveis para os clientes.`,
    })
  }

  // CT muito alto em absoluto (mais de 30 dias no P50)
  if (p50 > 30) {
    insights.push({
      type: 'warning',
      title: 'Cycle Time mediano elevado',
      body: `Metade dos itens leva mais de ${p50} dias. Pela Lei de Little, Cycle Time alto é sintoma direto de excesso de trabalho em progresso (WIP) ou filas de espera ociosas. Estabeleça limites de WIP (WIP Limits) no sistema puxado para forçar a conclusão antes de aceitar novas demandas.`,
    })
  } else if (p50 <= 7) {
    insights.push({
      type: 'success',
      title: 'Liquidez do Fluxo',
      body: `Com P50 de ${p50} dias, o sistema apresenta alta liquidez. O fluxo contínuo (Flow) está sendo mantido, o que reduz o custo de atraso (Cost of Delay) e acelera o ciclo de feedback (Lead Time) com o cliente.`,
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
        title: 'Throughput instável (Entregas em Lote)',
        body: `A variação de entregas é alta (IQR de ${iqr} sobre mediana de ${tpMedian}). Isso sugere que o sistema não está fluindo continuamente, mas operando em lotes (batching) ou sofrendo de inanição (starvation). No Kanban, busque equilibrar a demanda com a capacidade para suavizar a taxa de entrega.`,
      })
    } else if (tpVariability <= 0.3) {
      insights.push({
        type: 'success',
        title: 'Cadência de Entrega Sustentável',
        body: `O volume de entregas é estável (mediana de ${tpMedian} itens). O sistema alcançou um ritmo sustentável, equilibrando a taxa de entrada (Arrival Rate) com a taxa de saída (Departure Rate), fundamental para o planejamento previsível de capacidade.`,
      })
    }
  }

  // ── WIP ─────────────────────────────────────────────────────────────────────
  const wipRatio = items.length > 0 ? wip.length / items.length : 0

  if (wipRatio > 0.5) {
    insights.push({
      type: 'warning',
      title: 'Sobrecarga do Sistema (WIP Elevado)',
      body: `${wip.length} itens (${(wipRatio * 100).toFixed(0)}%) estão em andamento. No Kanban, "pare de começar e comece a terminar". WIP excessivo dilui a capacidade, causa trocas de contexto (context switching) e mascara gargalos. Implemente limites de WIP para proteger a equipe da sobrecarga (Muri).`,
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
        title: `${oldWip.length} ${oldWip.length === 1 ? 'item' : 'itens'} com envelhecimento crítico`,
        body: `${oldWip.length === 1 ? 'Um item está' : `${oldWip.length} itens estão`} no fluxo há mais de ${p95} dias (acima do P95). No Kanban, o envelhecimento do WIP (WIP Aging) é o principal indicador de risco de atraso. Discuta esses itens imediatamente na reunião de fluxo (Kanban Meeting) para "desbloquear" o valor represado.`,
      })
    }
  }

  // ── Itens com CT = 0 ────────────────────────────────────────────────────────
  const zeroCT = concluded.filter(i => i.cycleTime === 0)
  const zeroPct = concluded.length > 0 ? (zeroCT.length / concluded.length) * 100 : 0
  if (zeroPct > 15) {
    insights.push({
      type: 'info',
      title: `${zeroPct.toFixed(0)}% dos itens com Cycle Time zero (Trabalho Oculto)`,
      body: `${zeroCT.length} itens foram concluídos no mesmo dia. Isso frequentemente indica "trabalho invisível" sendo registrado apenas após a conclusão, burlando o sistema puxado. Torne o trabalho visível desde o início para refletir a verdadeira carga da equipe.`,
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
        title: `Gargalo Sistêmico em "${topStatus}"`,
        body: `${topCount} itens (${topPct.toFixed(0)}%) estão acumulados em "${topStatus}". Na Teoria das Restrições, o fluxo do sistema é ditado pelo seu gargalo. Subordine o sistema à capacidade dessa etapa e aplique um limite de WIP rigoroso para expor o problema e forçar a colaboração (Swarming) para resolvê-lo.`,
      })
    }
  }

  return insights
}

const ICON_COMPONENT: Record<Insight['type'], React.FC<{ size?: number; className?: string }>> = {
  warning: IconWarning,
  success: IconCheck,
  info: IconInfo,
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
        <IconSearch size={15} className="text-[#BF452A]" /> Insights de Gestão de Fluxo
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`border rounded-xl px-4 py-3 text-xs leading-relaxed ${STYLE[insight.type]}`}
          >
            <div className={`font-bold mb-1 flex items-center gap-1.5 ${TITLE_STYLE[insight.type]}`}>
              {(() => { const IC = ICON_COMPONENT[insight.type]; return <IC size={13} />; })()}
              <span>{insight.title}</span>
            </div>
            <p>{insight.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
