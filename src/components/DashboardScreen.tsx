import { useMemo, useState } from "react"
import { useApp } from "../lib/context"
import { getPercentile, getGroupLabel, computeThroughputMedian } from "../lib/mapping"
import type { GroupBy } from "../types"
import Charts from "./charts/Charts"
import InsightsPanel from "./InsightsPanel"

export default function DashboardScreen() {
  const {
    t, workItems, groupBy, setGroupBy,
    selectedTeams, setSelectedTeams,
    selectedStatuses, setSelectedStatuses,
    selectedTypes, setSelectedTypes,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    resetAll,
  } = useApp()

  const [excludeZeroCT, setExcludeZeroCT] = useState(false)

  const allTeams = useMemo(() => [...new Set(workItems.map(i => i.team).filter(Boolean) as string[])].sort(), [workItems])
  const allStatuses = useMemo(() => [...new Set(workItems.map(i => i.currentStatus).filter(Boolean) as string[])].sort(), [workItems])
  const allTypes = useMemo(() => [...new Set(workItems.map(i => i.type).filter(Boolean) as string[])].sort(), [workItems])

  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      if (dateFrom && item.entryDate < dateFrom) return false
      if (dateTo && item.entryDate > dateTo) return false
      if (selectedTeams.length > 0 && item.team && !selectedTeams.includes(item.team)) return false
      if (selectedStatuses.length > 0 && item.currentStatus && !selectedStatuses.includes(item.currentStatus)) return false
      if (selectedTypes.length > 0 && item.type && !selectedTypes.includes(item.type)) return false
      return true
    })
  }, [workItems, dateFrom, dateTo, selectedTeams, selectedStatuses, selectedTypes])

  const concluded = filteredItems.filter(i => i.cycleTime !== undefined)
  const concludedForMetrics = excludeZeroCT ? concluded.filter(i => i.cycleTime! > 0) : concluded
  const wip = filteredItems.filter(i => i.cycleTime === undefined)
  const hasNoConcluded = concluded.length === 0

  const ctValues = concludedForMetrics.map(i => i.cycleTime!).sort((a, b) => a - b)
  const ctP50 = getPercentile(ctValues, 50)
  const ctP85 = getPercentile(ctValues, 85)
  const ctP95 = getPercentile(ctValues, 95)

  const { median: tpMedian, isLastPartial } = computeThroughputMedian(filteredItems, groupBy)

  const groupByOptions: GroupBy[] = ["day", "week", "month", "year"]

  function toggleFilter<T>(val: T, list: T[], setList: (l: T[]) => void) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val])
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <aside className="w-64 shrink-0 bg-white border-r border-[#F2C5BB] p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#092140]">{t.dashboard.filters}</h2>
          <button onClick={resetAll} className="text-xs text-[#BF452A] hover:underline">{t.dashboard.reset}</button>
        </div>
        <div className="mb-5">
          <label className="text-xs font-semibold text-[#D99789] uppercase tracking-wide block mb-1">{t.dashboard.from}</label>
          <input type="date" className="w-full border border-[#D99789] rounded px-2 py-1 text-sm text-[#092140]"
            onChange={e => setDateFrom(e.target.value ? new Date(e.target.value) : null)} />
          <label className="text-xs font-semibold text-[#D99789] uppercase tracking-wide block mt-2 mb-1">{t.dashboard.to}</label>
          <input type="date" className="w-full border border-[#D99789] rounded px-2 py-1 text-sm text-[#092140]"
            onChange={e => setDateTo(e.target.value ? new Date(e.target.value) : null)} />
        </div>
        <div className="mb-5">
          <label className="text-xs font-semibold text-[#D99789] uppercase tracking-wide block mb-2">{t.dashboard.groupBy}</label>
          <div className="flex flex-wrap gap-1">
            {groupByOptions.map(g => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={groupBy === g ? "px-3 py-1 rounded-full text-xs font-medium bg-[#BF452A] text-white" : "px-3 py-1 rounded-full text-xs font-medium bg-[#F2F2F2] text-[#092140] hover:bg-[#F2C5BB]"}>
                {getGroupLabel(g, "pt-BR")}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={excludeZeroCT} onChange={e => setExcludeZeroCT(e.target.checked)} className="accent-[#BF452A]" />
            <span className="text-xs font-semibold text-[#D99789] uppercase tracking-wide">Excluir CT = 0</span>
          </label>
          <p className="text-xs text-gray-400 mt-1">Remove itens concluídos no mesmo dia (ex: migrações)</p>
        </div>
        {allTeams.length > 0 && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-[#D99789] uppercase tracking-wide block mb-2">{t.dashboard.team}</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allTeams.map(team => (
                <label key={team} className="flex items-center gap-2 text-xs text-[#092140] cursor-pointer">
                  <input type="checkbox" checked={selectedTeams.includes(team)}
                    onChange={() => toggleFilter(team, selectedTeams, setSelectedTeams)} className="accent-[#BF452A]" />
                  <span className="truncate">{team}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {allStatuses.length > 0 && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-[#D99789] uppercase tracking-wide block mb-2">{t.dashboard.status}</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allStatuses.map(s => (
                <label key={s} className="flex items-center gap-2 text-xs text-[#092140] cursor-pointer">
                  <input type="checkbox" checked={selectedStatuses.includes(s)}
                    onChange={() => toggleFilter(s, selectedStatuses, setSelectedStatuses)} className="accent-[#BF452A]" />
                  <span className="truncate">{s}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {allTypes.length > 0 && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-[#D99789] uppercase tracking-wide block mb-2">{t.dashboard.type}</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {allTypes.map(tp => (
                <label key={tp} className="flex items-center gap-2 text-xs text-[#092140] cursor-pointer">
                  <input type="checkbox" checked={selectedTypes.includes(tp)}
                    onChange={() => toggleFilter(tp, selectedTypes, setSelectedTypes)} className="accent-[#BF452A]" />
                  <span className="truncate">{tp}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        {hasNoConcluded && (
          <div className="mb-4 bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <span>⚠️</span><span>{t.dashboard.wipOnly}</span>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {[
            { label: t.dashboard.completed, value: concluded.length },
            { label: t.dashboard.wip, value: wip.length },
            { label: t.dashboard.total, value: filteredItems.length },
            { label: t.dashboard.ctP50, value: hasNoConcluded ? "—" : ctP50 + "d", hl: true },
            { label: t.dashboard.ctP85, value: hasNoConcluded ? "—" : ctP85 + "d", hl: true },
            { label: t.dashboard.ctP95, value: hasNoConcluded ? "—" : ctP95 + "d", hl: true },
          ].map(({ label, value, hl }) => (
            <div key={label} className={hl ? "rounded-xl p-4 shadow-sm border bg-[#092140] border-[#092140]" : "rounded-xl p-4 shadow-sm border bg-white border-[#F2C5BB]"}>
              <div className="text-xs font-medium mb-1 text-[#D99789]">{label}</div>
              <div className={hl ? "text-2xl font-bold text-white" : "text-2xl font-bold text-[#092140]"}>{value}</div>
            </div>
          ))}
        </div>
        {isLastPartial && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-xs">
            ℹ️ Último período incompleto — excluído do cálculo do Throughput mediano ({tpMedian}/semana).
          </div>
        )}
        <InsightsPanel items={filteredItems} groupBy={groupBy} excludeZeroCT={excludeZeroCT} />
        <Charts items={filteredItems} groupBy={groupBy} excludeZeroCT={excludeZeroCT} />
      </main>
    </div>
  )
}
