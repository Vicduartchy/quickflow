export interface WorkItem {
  id: string
  type?: string
  entryDate: Date
  exitDate?: Date
  currentStatus?: string
  cycleTime?: number // days
}

export interface ColumnMapping {
  id: string | null
  type: string | null
  entryDate: string | null
  exitDate: string | null
  currentStatus: string | null
}

export interface MappingConfidence {
  field: keyof ColumnMapping
  column: string
  confidence: 'high' | 'medium' | 'low'
}

export interface ChartAvailability {
  cfd: { available: boolean; missing: string[] }
  scatterplot: { available: boolean; missing: string[] }
  breakdown: { available: boolean; missing: string[] }
  histogram: { available: boolean; missing: string[] }
  aging: { available: boolean; missing: string[] }
  throughputRun: { available: boolean; missing: string[] }
  throughputHistogram: { available: boolean; missing: string[] }
}

export type Language = 'pt-BR' | 'en-US'

export type ChartId = 'cfd' | 'scatterplot' | 'breakdown' | 'histogram' | 'aging' | 'throughputRun' | 'throughputHistogram'
