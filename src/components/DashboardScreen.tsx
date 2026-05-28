import { useState, useMemo } from 'react'
import { useApp } from '../lib/context'
import type { GroupBy } from '../lib/context'
import { ChartCard } from './ui/ChartCard'
import {
  CFDChart, ScatterplotChart, BreakdownChart,
  HistogramChart, AgingChart, ThroughputRunChart, ThroughputHistogramChart
} from './charts/Charts'
import { getPercentile, getWeekKey, getGroupLabel } from '../lib/mapping'

export function DashboardScreen() {
  const { t, lang, workItems, availability, resetAll, groupBy, setGroupBy, selectedStatuses, setSelectedStatuses, selectedTypes, setSelectedTypes } = useApp()
  const [confirmReset, setConfirmReset] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const allStatuses = useMemo(() => [...new Set(workItems.map(i => i.currentStatus).filter(Boolean))] as string[], [workItems])
  const allTypes = useMemo(() => [...new Set(workItems.map(i => i.type).filter(Boolean))] as string[], [workItems])

  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      const d = item.exitDate ?? item.entryDate
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false
      if (selectedStatuses.length > 0 && item.currentStatus && !selectedStatuses.includes(item.currentStatus)) return false
      if (selectedTypes.length > 0 && item.type && !selectedTypes.includes(item.type)) return false
      return true
    })
  }, [workItems, dateFrom, dateTo, selectedStatuses, selectedTypes])

  if (!availability) return null

  const completedItems = filteredItems.filter(i => i.cycleTime !== undefined)
  const sortedCT = completedItems.map(i => i.cycleTime!).sort((a,b) => a-b)
  const p50 = getPercentile(sortedCT, 50)
  const p85 = getPercentile(sortedCT, 85)
  const p95 = getPercentile(sortedCT, 95)

  const scatterInsights: string[] = []
  if (sortedCT.length > 0) scatterInsights.push(p85 > p50 * 2 ? t.insightHighVariability : t.insightStableFlow)

  const inProgressAboveP85 = filteredItems.filter(i => {
    if (i.exitDate) return false
    return Math.round((Date.now() - i.entryDate.getTime()) / 86400000) > p85
  }).length
  const agingInsights = inProgressAboveP85 > 0 ? [t.insightAgingWarning(inProgressAboveP85)] : []

  const wipItems = filteredItems.filter(i => !i.exitDate).length
  const cfdInsights = wipItems > 0 ? [lang === 'pt-BR' ? `${wipItems} itens em progresso no fluxo.` : `${wipItems} items in progress.`] : []

  const weekMap = new Map<string, number>()
  filteredItems.filter(i => i.exitDate).forEach(i => { const k = getWeekKey(i.exitDate!); weekMap.set(k, (weekMap.get(k)??0)+1) })
  const weekValues = [...weekMap.values()].sort((a,b) => a-b)
  const tpMedian = getPercentile(weekValues, 50)
  const throughputInsights: string[] = []
  if (weekValues.length > 1) {
    const half = Math.floor(weekValues.length/2)
    const firstAvg = weekValues.slice(0,half).reduce((a,b)=>a+b,0)/half
    const lastAvg = weekValues.slice(half).reduce((a,b)=>a+b,0)/(weekValues.length-half)
    if (lastAvg > firstAvg * 1.1) throughputInsights.push(t.insightThroughputUp)
    else if (lastAvg < firstAvg * 0.9) throughputInsights.push(t.insightThroughputDown)
    const grpLabel = getGroupLabel(groupBy, lang)
    throughputInsights.push(lang === 'pt-BR' ? `Use ${tpMedian} itens/${grpLabel.slice(0,-1)} como base de comprometimento.` : `Use ${tpMedian} items/${grpLabel.slice(0,-1)} as commitment baseline.`)
  }

  const histInsights = sortedCT.length > 0 ? [
    lang === 'pt-BR' ? `95% dos itens concluídos em até ${p95} dias.` : `95% of items completed within ${p95} days.`,
    ...(p85 > p50*2 ? [lang==='pt-BR'?'Cauda longa: alta variabilidade no processo.':'Long tail: high process variability.'] : [])
  ] : []

  const tpHistInsights = weekValues.length > 0 ? [
    lang==='pt-BR' ? `Mediana de ${tpMedian} itens/${getGroupLabel(groupBy,lang).slice(0,-1)}. Use para prever entregas futuras.` : `Median of ${tpMedian} items/${getGroupLabel(groupBy,lang).slice(0,-1)}. Use to forecast deliveries.`
  ] : []

  const charts = [
    { id: 'cfd' as const, avail: availability.cfd, chart: <CFDChart items={filteredItems} />, insights: cfdInsights },
    { id: 'scatterplot' as const, avail: availability.scatterplot, chart: <ScatterplotChart items={filteredItems} />, insights: scatterInsights },
    { id: 'breakdown' as const, avail: availability.breakdown, chart: <BreakdownChart items={filteredItems} />, insights: undefined },
    { id: 'histogram' as const, avail: availability.histogram, chart: <HistogramChart items={filteredItems} />, insights: histInsights },
    { id: 'aging' as const, avail: availability.aging, chart: <AgingChart items={filteredItems} />, insights: agingInsights },
    { id: 'throughputRun' as const, avail: availability.throughputRun, chart: <ThroughputRunChart items={filteredItems} />, insights: throughputInsights },
    { id: 'throughputHistogram' as const, avail: availability.throughputHistogram, chart: <ThroughputHistogramChart items={filteredItems} />, insights: tpHistInsights },
  ]

  const groupLabels: Record<GroupBy, string> = lang==='pt-BR'
    ? { day:'Dias', week:'Semanas', month:'Meses', year:'Anos' }
    : { day:'Days', week:'Weeks', month:'Months', year:'Years' }

  const toggleStatus = (s: string) => setSelectedStatuses(selectedStatuses.includes(s) ? selectedStatuses.filter(x=>x!==s) : [...selectedStatuses,s])
  const toggleType = (s: string) => setSelectedTypes(selectedTypes.includes(s) ? selectedTypes.filter(x=>x!==s) : [...selectedTypes,s])

  const cancelLabel = lang==='pt-BR'?'Cancelar':'Cancel'
  const confirmLabel = lang==='pt-BR'?'Confirmar':'Confirm'
  const completedLabel = lang==='pt-BR'?'concluídos':'completed'

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto bg-[#F2F2F2]">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#092140]">{t.dashboardTitle}</h1>
          <p className="text-[#D99789] text-sm mt-1">{filteredItems.length} {t.items} · {completedItems.length} {completedLabel}</p>
        </div>
        <button onClick={()=>setConfirmReset(true)} className="flex items-center gap-2 px-4 py-2 border border-[#D99789] hover:border-[#BF452A] text-[#D99789] hover:text-[#BF452A] rounded-xl text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          {t.newAnalysis}
        </button>
      </div>

      {/* Controls */}
      <div className="mb-4 p-4 bg-white border border-[#F2C5BB] rounded-2xl space-y-4">
        {/* Período + Agrupamento */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs font-semibold text-[#D99789] block mb-1">{lang==='pt-BR'?'De':'From'}</label>
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="bg-[#F2F2F2] border border-[#D99789] text-[#092140] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#BF452A]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#D99789] block mb-1">{lang==='pt-BR'?'Até':'To'}</label>
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="bg-[#F2F2F2] border border-[#D99789] text-[#092140] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#BF452A]" />
            </div>
            {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom('');setDateTo('')}} className="px-3 py-2 text-xs font-medium text-[#BF452A] border border-[#BF452A] rounded-lg hover:bg-[#BF452A] hover:text-white transition-colors">{lang==='pt-BR'?'Limpar':'Clear'}</button>}
          </div>
          <div className="ml-auto">
            <label className="text-xs font-semibold text-[#D99789] block mb-1">{lang==='pt-BR'?'Agrupar por':'Group by'}</label>
            <div className="flex gap-1 bg-[#F2F2F2] rounded-xl p-1 border border-[#F2C5BB]">
              {(['day','week','month','year'] as GroupBy[]).map(g=>(
                <button key={g} onClick={()=>setGroupBy(g)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${groupBy===g?'bg-[#BF452A] text-white':'text-[#D99789] hover:text-[#092140]'}`}>{groupLabels[g]}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Status */}
        {allStatuses.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-[#D99789] block mb-2">{lang==='pt-BR'?'Filtrar por status':'Filter by status'}</label>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map(s=>(
                <button key={s} onClick={()=>toggleStatus(s)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${selectedStatuses.includes(s)?'bg-[#092140] text-white border-[#092140]':'border-[#D99789] text-[#D99789] hover:border-[#092140] hover:text-[#092140]'}`}>{s}</button>
              ))}
              {selectedStatuses.length>0 && <button onClick={()=>setSelectedStatuses([])} className="px-3 py-1 text-xs rounded-full border border-[#BF452A] text-[#BF452A] hover:bg-[#BF452A] hover:text-white transition-colors font-medium">✕ {lang==='pt-BR'?'Limpar':'Clear'}</button>}
            </div>
          </div>
        )}

        {/* Times/Projetos */}
        {allTypes.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-[#D99789] block mb-2">{lang==='pt-BR'?'Filtrar por time/projeto':'Filter by team/project'}</label>
            <div className="flex flex-wrap gap-2">
              {allTypes.map(s=>(
                <button key={s} onClick={()=>toggleType(s)} className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${selectedTypes.includes(s)?'bg-[#BF452A] text-white border-[#BF452A]':'border-[#D99789] text-[#D99789] hover:border-[#BF452A] hover:text-[#BF452A]'}`}>{s}</button>
              ))}
              {selectedTypes.length>0 && <button onClick={()=>setSelectedTypes([])} className="px-3 py-1 text-xs rounded-full border border-[#BF452A] text-[#BF452A] hover:bg-[#BF452A] hover:text-white transition-colors font-medium">✕ {lang==='pt-BR'?'Limpar':'Clear'}</button>}
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 p-3 bg-[#F2C5BB]/30 border border-[#D99789]/40 rounded-xl">
        <p className="text-[#BF452A] text-sm text-center">{t.uploadWarning}</p>
      </div>

      <div className="grid gap-6">
        {charts.map(({id,avail,chart,insights})=>(
          <ChartCard key={id} id={id} title={t.charts[id]} description={t.descriptions[id]} available={avail.available} missing={avail.missing} insights={insights}>{chart}</ChartCard>
        ))}
      </div>

      <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} className="fixed bottom-6 right-6 w-12 h-12 bg-[#BF452A] hover:bg-[#092140] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
      </button>

      {confirmReset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white border border-[#F2C5BB] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="text-[#092140] font-medium mb-4 text-center">{t.newAnalysisConfirm}</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmReset(false)} className="flex-1 py-2.5 border border-[#D99789] rounded-xl text-[#D99789] text-sm">{cancelLabel}</button>
              <button onClick={()=>{resetAll();setConfirmReset(false)}} className="flex-1 py-2.5 bg-[#BF452A] hover:bg-[#092140] text-white rounded-xl font-semibold text-sm transition-colors">{confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
