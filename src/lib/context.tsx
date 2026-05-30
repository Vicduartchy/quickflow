import { createContext, useContext, useState, type ReactNode } from 'react'
import type { WorkItem, ColumnMapping, ChartAvailability, Language, FlowPolicy, StatusConfig } from '../types'
import { translations } from '../i18n/translations'

type AppStep = 'upload' | 'mapping' | 'policy' | 'dashboard'
export type GroupBy = 'day' | 'week' | 'month' | 'year'

interface AppContextType {
  step: AppStep; setStep: (s: AppStep) => void
  lang: Language; toggleLang: () => void
  t: typeof translations['pt-BR']
  rawHeaders: string[]; setRawHeaders: (h: string[]) => void
  rawRows: Record<string, unknown>[]; setRawRows: (r: Record<string, unknown>[]) => void
  mapping: ColumnMapping; setMapping: (m: ColumnMapping) => void
  workItems: WorkItem[]; setWorkItems: (w: WorkItem[]) => void
  availability: ChartAvailability | null; setAvailability: (a: ChartAvailability) => void
  flowPolicy: FlowPolicy; setFlowPolicy: (p: FlowPolicy) => void
  resetAll: () => void
  groupBy: GroupBy; setGroupBy: (g: GroupBy) => void
  selectedStatuses: string[]; setSelectedStatuses: (s: string[]) => void
  selectedTypes: string[]; setSelectedTypes: (s: string[]) => void
  selectedTeams: string[]; setSelectedTeams: (s: string[]) => void
}

const AppContext = createContext<AppContextType | null>(null)
const defaultMapping: ColumnMapping = { id: null, type: null, team: null, entryDate: null, exitDate: null, currentStatus: null }
const defaultPolicy: FlowPolicy = { statusConfigs: [] }

export function AppProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<AppStep>('upload')
  const [lang, setLang] = useState<Language>('pt-BR')
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>(defaultMapping)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [availability, setAvailability] = useState<ChartAvailability | null>(null)
  const [flowPolicy, setFlowPolicy] = useState<FlowPolicy>(defaultPolicy)
  const [groupBy, setGroupBy] = useState<GroupBy>('week')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])

  const toggleLang = () => setLang(l => l === 'pt-BR' ? 'en-US' : 'pt-BR')
  const t = translations[lang]

  const resetAll = () => {
    setStep('upload'); setRawHeaders([]); setRawRows([]); setMapping(defaultMapping)
    setWorkItems([]); setAvailability(null); setFlowPolicy(defaultPolicy)
    setGroupBy('week'); setSelectedStatuses([]); setSelectedTypes([]); setSelectedTeams([])
  }

  return (
    <AppContext.Provider value={{
      step, setStep, lang, toggleLang, t,
      rawHeaders, setRawHeaders, rawRows, setRawRows,
      mapping, setMapping, workItems, setWorkItems,
      availability, setAvailability, flowPolicy, setFlowPolicy,
      resetAll, groupBy, setGroupBy,
      selectedStatuses, setSelectedStatuses,
      selectedTypes, setSelectedTypes,
      selectedTeams, setSelectedTeams,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
