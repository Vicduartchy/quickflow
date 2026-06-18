import React, { createContext, useContext, useState, useEffect } from 'react'
import type { WorkItem, ColumnMapping, FlowPolicy, GroupBy, Step } from '../types'
import { translations } from '../i18n/translations'
import type { Lang } from '../i18n/translations'

interface AppContextType {
  step: Step
  setStep: (s: Step) => void
  lang: Lang
  toggleLang: () => void
  t: (typeof translations)[Lang]
  rawRows: Record<string, unknown>[]
  setRawRows: (rows: Record<string, unknown>[]) => void
  headers: string[]
  setHeaders: (h: string[]) => void
  workItems: WorkItem[]
  setWorkItems: (items: WorkItem[]) => void
  mapping: ColumnMapping
  setMapping: (m: ColumnMapping) => void
  flowPolicy: FlowPolicy
  setFlowPolicy: (p: FlowPolicy) => void
  groupBy: GroupBy
  setGroupBy: (g: GroupBy) => void
  selectedTeams: string[]
  setSelectedTeams: (t: string[]) => void
  selectedStatuses: string[]
  setSelectedStatuses: (s: string[]) => void
  selectedTypes: string[]
  setSelectedTypes: (t: string[]) => void
  dateFrom: Date | null
  setDateFrom: (d: Date | null) => void
  dateTo: Date | null
  setDateTo: (d: Date | null) => void
  resetAll: () => void
}

const defaultMapping: ColumnMapping = {
  id: null, type: null, team: null,
  entryDate: null, exitDate: null, currentStatus: null,
}

const STORAGE = {
  workItems: 'qf_workItems',
  mapping: 'qf_mapping',
  flowPolicy: 'qf_flowPolicy',
  headers: 'qf_headers',
}

function loadWorkItems(): WorkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE.workItems)
    if (!raw) return []
    return (JSON.parse(raw) as Array<Record<string, unknown>>).map(item => ({
      ...item,
      entryDate: new Date(item.entryDate as string),
      exitDate: item.exitDate ? new Date(item.exitDate as string) : undefined,
    })) as WorkItem[]
  } catch { return [] }
}

function saveWorkItems(items: WorkItem[]) {
  localStorage.setItem(STORAGE.workItems, JSON.stringify(items.map(i => ({
    ...i,
    entryDate: i.entryDate.toISOString(),
    exitDate: i.exitDate?.toISOString(),
  }))))
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch { return fallback }
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<Step>(() =>
    loadWorkItems().length > 0 ? 'dashboard' : 'upload'
  )
  const [lang, setLang] = useState<Lang>('pt-BR')
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [headers, setHeaders] = useState<string[]>(() => loadJson(STORAGE.headers, []))
  const [workItems, setWorkItems] = useState<WorkItem[]>(loadWorkItems)
  const [mapping, setMapping] = useState<ColumnMapping>(() => loadJson(STORAGE.mapping, defaultMapping))
  const [flowPolicy, setFlowPolicy] = useState<FlowPolicy>(() => loadJson(STORAGE.flowPolicy, { statusConfigs: [] }))
  const [groupBy, setGroupBy] = useState<GroupBy>('week')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)

  useEffect(() => { saveWorkItems(workItems) }, [workItems])
  useEffect(() => { localStorage.setItem(STORAGE.mapping, JSON.stringify(mapping)) }, [mapping])
  useEffect(() => { localStorage.setItem(STORAGE.flowPolicy, JSON.stringify(flowPolicy)) }, [flowPolicy])
  useEffect(() => { localStorage.setItem(STORAGE.headers, JSON.stringify(headers)) }, [headers])

  const toggleLang = () => setLang(l => l === 'pt-BR' ? 'en-US' : 'pt-BR')
  const t = translations[lang]

  const resetAll = () => {
    Object.values(STORAGE).forEach(k => localStorage.removeItem(k))
    setStep('upload')
    setRawRows([])
    setHeaders([])
    setWorkItems([])
    setMapping(defaultMapping)
    setFlowPolicy({ statusConfigs: [] })
    setGroupBy('week')
    setSelectedTeams([])
    setSelectedStatuses([])
    setSelectedTypes([])
    setDateFrom(null)
    setDateTo(null)
  }

  return (
    <AppContext.Provider value={{
      step, setStep, lang, toggleLang, t,
      rawRows, setRawRows, headers, setHeaders,
      workItems, setWorkItems, mapping, setMapping,
      flowPolicy, setFlowPolicy, groupBy, setGroupBy,
      selectedTeams, setSelectedTeams,
      selectedStatuses, setSelectedStatuses,
      selectedTypes, setSelectedTypes,
      dateFrom, setDateFrom, dateTo, setDateTo,
      resetAll,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
