import type { ColumnMapping, MappingConfidence } from '../types'
import type { GroupBy } from './context'

const FIELD_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  id: [/^(id|issue.?id|item.?id|task.?id|card.?id|ticket.?id|work.?item.?id|número|numero|#)$/i, /\bid\b/i],
  type: [/^(type|tipo|issue.?type|tipo.?de.?item|tipo.?de.?issue|categoria|category|kind|work.?item.?type|team|time|projeto|project|squad)$/i],
  entryDate: [/^(created|created.?date|create.?date|data.?de.?criação|data.?criacao|data.?de.?entrada|entry.?date|start.?date|data.?inicio|data.?início|opened|open.?date|reported|raised|submitted|criado.?em|criado|created.?at|inicio)$/i, /(criad|created|started|opened|raised|entry|entrada|início|inicio)/i],
  exitDate: [/^(resolved|resolved.?date|resolution.?date|closed|closed.?date|close.?date|done|done.?date|completed|completed.?date|completion.?date|data.?de.?conclusão|data.?conclusao|data.?de.?fechamento|data.?fechamento|data.?resolução|data.?resolucao|finished|finish.?date|delivered|delivery.?date|data.?entrega|data.?de.?entrega|exitdate|exit.?date)$/i, /(resolv|closed|done|complet|finish|entregue|conclus|fechad|resolu)/i],
  currentStatus: [/^(status|estado|state|current.?status|status.?atual|column|coluna|stage|etapa|fase|phase|workflow.?state)$/i],
}

function scoreColumn(header: string, patterns: RegExp[]): number {
  const normalized = header.trim().toLowerCase()
  for (let i = 0; i < patterns.length; i++) { if (patterns[i].test(normalized)) return i === 0 ? 2 : 1 }
  return 0
}

export function inferColumnMapping(headers: string[]): { mapping: ColumnMapping; confidence: MappingConfidence[] } {
  const mapping: ColumnMapping = { id: null, type: null, entryDate: null, exitDate: null, currentStatus: null }
  const confidence: MappingConfidence[] = []
  const used = new Set<string>()
  const fields = Object.keys(FIELD_PATTERNS) as (keyof ColumnMapping)[]
  for (const field of fields) {
    let bestScore = 0, bestHeader: string | null = null
    for (const header of headers) {
      if (used.has(header)) continue
      const score = scoreColumn(header, FIELD_PATTERNS[field])
      if (score > bestScore) { bestScore = score; bestHeader = header }
    }
    if (bestHeader && bestScore > 0) {
      mapping[field] = bestHeader; used.add(bestHeader)
      confidence.push({ field, column: bestHeader, confidence: bestScore === 2 ? 'high' : 'medium' })
    }
  }
  return { mapping, confidence }
}

export function parseDate(value: unknown): Date | null {
  if (!value) return null
  if (typeof value === 'number' && value > 10000) {
    const excelEpoch = new Date(1899, 11, 30)
    return new Date(excelEpoch.getTime() + value * 86400000)
  }
  const str = String(value).trim()
  if (!str) return null
  const formats = [str, str.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'), str.replace(/(\d{2})-(\d{2})-(\d{4})/, '$3-$2-$1')]
  for (const fmt of formats) { const d = new Date(fmt); if (!isNaN(d.getTime())) return d }
  return null
}

export function buildWorkItems(rows: Record<string, unknown>[], mapping: ColumnMapping) {
  return rows.map((row, index) => {
    const entryDate = mapping.entryDate ? parseDate(row[mapping.entryDate]) : null
    const exitDate = mapping.exitDate ? parseDate(row[mapping.exitDate]) : null
    if (!entryDate) return null
    const cycleTime = entryDate && exitDate ? Math.max(0, Math.round((exitDate.getTime() - entryDate.getTime()) / 86400000)) : undefined
    return {
      id: mapping.id ? String(row[mapping.id] ?? index + 1) : String(index + 1),
      type: mapping.type ? String(row[mapping.type] ?? '') : undefined,
      entryDate, exitDate: exitDate ?? undefined,
      currentStatus: mapping.currentStatus ? String(row[mapping.currentStatus] ?? '') : undefined,
      cycleTime,
    }
  }).filter(Boolean) as import('../types').WorkItem[]
}

export function computeChartAvailability(mapping: ColumnMapping) {
  const has = (f: keyof ColumnMapping) => !!mapping[f]
  return {
    cfd: { available: has('entryDate') && has('currentStatus'), missing: [...(!has('entryDate') ? ['entryDate'] : []), ...(!has('currentStatus') ? ['currentStatus'] : [])] },
    scatterplot: { available: has('entryDate') && has('exitDate'), missing: [...(!has('entryDate') ? ['entryDate'] : []), ...(!has('exitDate') ? ['exitDate'] : [])] },
    breakdown: { available: has('entryDate') && has('exitDate') && has('currentStatus'), missing: [...(!has('entryDate') ? ['entryDate'] : []), ...(!has('exitDate') ? ['exitDate'] : []), ...(!has('currentStatus') ? ['currentStatus'] : [])] },
    histogram: { available: has('entryDate') && has('exitDate'), missing: [...(!has('entryDate') ? ['entryDate'] : []), ...(!has('exitDate') ? ['exitDate'] : [])] },
    aging: { available: has('entryDate') && has('currentStatus'), missing: [...(!has('entryDate') ? ['entryDate'] : []), ...(!has('currentStatus') ? ['currentStatus'] : [])] },
    throughputRun: { available: has('exitDate'), missing: [...(!has('exitDate') ? ['exitDate'] : [])] },
    throughputHistogram: { available: has('exitDate'), missing: [...(!has('exitDate') ? ['exitDate'] : [])] },
  }
}

export function getPercentile(sortedValues: number[], p: number): number {
  if (!sortedValues.length) return 0
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, idx)]
}

export function getGroupKey(date: Date, groupBy: GroupBy): string {
  const d = new Date(date)
  if (groupBy === 'day') return d.toISOString().split('T')[0]
  if (groupBy === 'week') { d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0] }
  if (groupBy === 'month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  return String(d.getFullYear())
}

export function formatAxisDate(key: string, groupBy: GroupBy): string {
  if (groupBy === 'year') return key
  if (groupBy === 'month') {
    const [year, month] = key.split('-')
    return `${month}/${year.slice(2)}`
  }
  // day or week: YYYY-MM-DD → DD/MM/YY
  const parts = key.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`
  return key
}

export function getWeekKey(date: Date): string { return getGroupKey(date, 'week') }

export function getGroupLabel(groupBy: GroupBy, lang: string): string {
  const labels: Record<GroupBy, Record<string, string>> = {
    day:   { 'pt-BR': 'dias',    'en-US': 'days' },
    week:  { 'pt-BR': 'semanas', 'en-US': 'weeks' },
    month: { 'pt-BR': 'meses',   'en-US': 'months' },
    year:  { 'pt-BR': 'anos',    'en-US': 'years' },
  }
  return labels[groupBy][lang] ?? labels[groupBy]['en-US']
}
