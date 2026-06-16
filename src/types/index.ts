export interface WorkItem {
  id: string
  type?: string
  team?: string
  entryDate: Date
  exitDate?: Date
  currentStatus?: string
  cycleTime?: number
}

export interface ColumnMapping {
  id: string | null
  type: string | null
  team: string | null
  entryDate: string | null
  exitDate: string | null
  currentStatus: string | null
}

export type StatusCategory = 'backlog' | 'wip' | 'done' | 'unclassified'
export type FlowLayer = 'upstream' | 'downstream' | 'none'

export interface StatusConfig {
  status: string
  category: StatusCategory
  layer: FlowLayer
}

export interface FlowPolicy {
  statusConfigs: StatusConfig[]
}

export type GroupBy = 'day' | 'week' | 'month' | 'year'
export type Lang = 'pt-BR' | 'en-US'
export type Step = 'upload' | 'mapping' | 'policy' | 'dashboard'

export interface ChartAvailability {
  cfd: boolean
  scatterplot: boolean
  breakdown: boolean
  histogram: boolean
  aging: boolean
  throughputRun: boolean
}
