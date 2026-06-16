import React, { createContext, useContext, useState } from 'react'
import type { WorkItem, ColumnMapping, FlowPolicy, GroupBy, Step } from '../types'
import { translations } from '../i18n/translations'
import type { Lang, Translations } from '../i18n/translations'

interface AppContextType {
  step: Step
  setStep: (s: Step) => void
  lang: Lang
  toggleLang: () => void
  t: Translations
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

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<Step>('upload')
  const [lang, setLang] = useState<Lang>('pt-BR')
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>(defaultMapping)
  const [flowPolicy, setFlowPolicy] = useState<FlowPolicy>({ statusConfigs: [] })
  const [groupBy, setGroupBy] = useState<GroupBy>('week')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)

  const toggleLang = () => setLang(l => l === 'pt-BR' ? 'en-US' : 'pt-BR')
  const t = translations[lang]

  const resetAll = () => {
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
