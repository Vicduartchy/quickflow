import type { WorkItem, ColumnMapping, GroupBy } from '../types'

export function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined

  // Objeto Date nativo (vindo de cellDates:true no XLSX)
  if (value instanceof Date) {
    if (!isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate())
    return undefined
  }

  const str = String(value).trim()

  // dd/mm/yyyy hh:mm:ss  ou  dd/mm/yyyy  (formato brasileiro)
  const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    if (!isNaN(date.getTime())) return date
  }

  // yyyy-mm-dd  (formato ISO)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    if (!isNaN(date.getTime())) return date
  }

  // M/D/YY ou M/D/YYYY  (formato Excel/en-US: mês/dia/ano)
  const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (mdyMatch) {
    const [, m, d, yRaw] = mdyMatch
    const y = yRaw.length === 2 ? 2000 + Number(yRaw) : Number(yRaw)
    const date = new Date(y, Number(m) - 1, Number(d))
    if (!isNaN(date.getTime())) return date
  }

  // Serial numérico do Excel (fallback)
  if (typeof value === 'number' && value > 1000) {
    // Converter serial para UTC e extrair data sem offset de fuso
    const utcMs = Math.round((value - 25569) * 86400 * 1000)
    const utcDate = new Date(utcMs)
    const date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
    if (!isNaN(date.getTime())) return date
  }

  return undefined
}

export function computeCycleTime(entryDate: Date, exitDate: Date | undefined): number | undefined {
  if (!exitDate) return undefined
  const diffMs = exitDate.getTime() - entryDate.getTime()
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
}

export function getPercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, idx)]
}

export function getGroupKey(date: Date, groupBy: GroupBy): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  if (groupBy === 'day') return `${y}-${m}-${d}`
  if (groupBy === 'week') {
    const jan1 = new Date(y, 0, 1)
    const week = Math.ceil(((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
    return `${y}-W${String(week).padStart(2, '0')}`
  }
  if (groupBy === 'month') return `${y}-${m}`
  return `${y}`
}

const GROUP_LABELS: Record<GroupBy, Record<string, string>> = {
  day:   { 'pt-BR': 'dia',    'en-US': 'day'   },
  week:  { 'pt-BR': 'semana', 'en-US': 'week'  },
  month: { 'pt-BR': 'mês',    'en-US': 'month' },
  year:  { 'pt-BR': 'ano',    'en-US': 'year'  },
}

export function getGroupLabel(groupBy: GroupBy, lang: string): string {
  return GROUP_LABELS[groupBy]?.[lang] ?? groupBy
}

const FIELD_PATTERNS: Record<keyof ColumnMapping, Array<{ pattern: RegExp; score: number }>> = {
  id: [
    { pattern: /\bid\b/i, score: 3 },
    { pattern: /work.?item.?id|item.?id/i, score: 3 },
    { pattern: /código|code|number|num/i, score: 1 },
  ],
  type: [
    { pattern: /work.?item.?type|type|tipo/i, score: 3 },
    { pattern: /kind|categoria/i, score: 1 },
  ],
  team: [
    { pattern: /area.?path|area|squad|time|team/i, score: 3 },
    { pattern: /grupo|group/i, score: 1 },
  ],
  entryDate: [
    { pattern: /activate.?date|activated/i, score: 3 },
    { pattern: /created.?date|criado/i, score: 2 },
    { pattern: /entry|entrada|start|início|begin/i, score: 1 },
  ],
  exitDate: [
    { pattern: /closed.?date|close.?date|fechado|conclu/i, score: 3 },
    { pattern: /resolved.?date|done.?date|fim|end/i, score: 2 },
    { pattern: /exit|saída|finish/i, score: 1 },
  ],
  currentStatus: [
    { pattern: /^state$|^status$/i, score: 3 },
    { pattern: /estado|situação|current.?state/i, score: 2 },
    { pattern: /fase|stage/i, score: 1 },
  ],
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    id: null, type: null, team: null,
    entryDate: null, exitDate: null, currentStatus: null,
  }
  for (const field of Object.keys(mapping) as Array<keyof ColumnMapping>) {
    let bestHeader: string | null = null
    let bestScore = 0
    for (const header of headers) {
      for (const { pattern, score } of FIELD_PATTERNS[field]) {
        if (pattern.test(header) && score > bestScore) {
          bestScore = score
          bestHeader = header
        }
      }
    }
    mapping[field] = bestHeader
  }
  return mapping
}

export function buildWorkItems(rows: Record<string, unknown>[], mapping: ColumnMapping): WorkItem[] {
  const items: WorkItem[] = []
  for (const row of rows) {
    const entryDate = parseDate(mapping.entryDate ? row[mapping.entryDate] : undefined)
    if (!entryDate) continue
    const exitDate = parseDate(mapping.exitDate ? row[mapping.exitDate] : undefined)
    const cycleTime = computeCycleTime(entryDate, exitDate)
    items.push({
      id: mapping.id ? String(row[mapping.id] ?? '') : String(Math.random()),
      type: mapping.type ? String(row[mapping.type] ?? '') : undefined,
      team: mapping.team ? String(row[mapping.team] ?? '') : undefined,
      entryDate,
      exitDate,
      currentStatus: mapping.currentStatus ? String(row[mapping.currentStatus] ?? '') : undefined,
      cycleTime,
    })
  }
  return items
}

export function getDatasetMaxDate(items: WorkItem[]): Date {
  let max = 0
  for (const item of items) {
    if (item.entryDate.getTime() > max) max = item.entryDate.getTime()
    if (item.exitDate && item.exitDate.getTime() > max) max = item.exitDate.getTime()
  }
  return max > 0 ? new Date(max) : new Date()
}

export function computeThroughputMedian(items: WorkItem[], groupBy: GroupBy): { median: number; isLastPartial: boolean } {
  const concluded = items.filter(i => i.exitDate && i.cycleTime !== undefined)
  if (concluded.length === 0) return { median: 0, isLastPartial: false }
  const counts = new Map<string, number>()
  for (const item of concluded) {
    const key = getGroupKey(item.exitDate!, groupBy)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const sortedKeys = [...counts.keys()].sort()
  const allValues = sortedKeys.map(k => counts.get(k)!)
  const withoutLast = allValues.slice(0, -1)
  const lastCount = allValues[allValues.length - 1]
  const sortedAll = [...allValues].sort((a, b) => a - b)
  const medianAll = getPercentile(sortedAll, 50)
  const isLastPartial = withoutLast.length > 0 && lastCount < medianAll * 0.5
  const valuesForMedian = isLastPartial ? withoutLast : allValues
  const sorted = [...valuesForMedian].sort((a, b) => a - b)
  return { median: getPercentile(sorted, 50), isLastPartial }
}
