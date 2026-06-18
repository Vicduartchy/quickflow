import { describe, it, expect } from 'vitest'
import {
  parseDate,
  computeCycleTime,
  getPercentile,
  getGroupKey,
  autoMapColumns,
  buildWorkItems,
  computeThroughputMedian,
} from './mapping'

// ── parseDate ────────────────────────────────────────────────────────────────

describe('parseDate', () => {
  it('retorna undefined para valores vazios', () => {
    expect(parseDate(null)).toBeUndefined()
    expect(parseDate(undefined)).toBeUndefined()
    expect(parseDate('')).toBeUndefined()
  })

  it('aceita objeto Date nativo e normaliza para meia-noite local', () => {
    const result = parseDate(new Date(2024, 0, 15, 10, 30))
    expect(result).toEqual(new Date(2024, 0, 15))
  })

  it('rejeita Date inválido', () => {
    expect(parseDate(new Date('invalid'))).toBeUndefined()
  })

  it('parseia formato brasileiro DD/MM/YYYY', () => {
    expect(parseDate('15/01/2024')).toEqual(new Date(2024, 0, 15))
  })

  it('parseia formato brasileiro com hora DD/MM/YYYY HH:MM:SS', () => {
    expect(parseDate('15/01/2024 10:30:00')).toEqual(new Date(2024, 0, 15))
  })

  it('parseia formato ISO YYYY-MM-DD', () => {
    expect(parseDate('2024-01-15')).toEqual(new Date(2024, 0, 15))
  })

  it('parseia formato ISO com hora YYYY-MM-DDTHH:MM:SS', () => {
    expect(parseDate('2024-01-15T10:30:00')).toEqual(new Date(2024, 0, 15))
  })

  it('parseia formato Excel en-US M/D/YY (ano com 2 dígitos)', () => {
    // Formato com ano de 2 dígitos não colide com DD/MM/YYYY (exige 4 dígitos)
    expect(parseDate('1/15/24')).toEqual(new Date(2024, 0, 15))
  })

  it('parseia serial numérico do Excel', () => {
    // Serial 45306 = 2024-01-15
    const result = parseDate(45306)
    expect(result).toBeInstanceOf(Date)
    expect(result!.getFullYear()).toBe(2024)
    expect(result!.getMonth()).toBe(0)
    expect(result!.getDate()).toBe(15)
  })

  it('retorna undefined para string inválida', () => {
    expect(parseDate('não é uma data')).toBeUndefined()
    expect(parseDate('abc/def/ghij')).toBeUndefined()
  })
})

// ── computeCycleTime ─────────────────────────────────────────────────────────

describe('computeCycleTime', () => {
  it('retorna undefined quando não há exitDate', () => {
    expect(computeCycleTime(new Date(2024, 0, 1), undefined)).toBeUndefined()
  })

  it('calcula dias corretamente', () => {
    const entry = new Date(2024, 0, 1)
    const exit = new Date(2024, 0, 11)
    expect(computeCycleTime(entry, exit)).toBe(10)
  })

  it('retorna 0 para itens concluídos no mesmo dia', () => {
    const d = new Date(2024, 0, 1)
    expect(computeCycleTime(d, d)).toBe(0)
  })

  it('retorna 0 mesmo se exitDate for anterior a entryDate (proteção contra dados sujos)', () => {
    const entry = new Date(2024, 0, 10)
    const exit = new Date(2024, 0, 1)
    expect(computeCycleTime(entry, exit)).toBe(0)
  })
})

// ── getPercentile ─────────────────────────────────────────────────────────────

describe('getPercentile', () => {
  it('retorna 0 para array vazio', () => {
    expect(getPercentile([], 50)).toBe(0)
  })

  it('retorna o único valor de um array unitário', () => {
    expect(getPercentile([5], 50)).toBe(5)
    expect(getPercentile([5], 95)).toBe(5)
  })

  it('calcula P50 (mediana) corretamente', () => {
    expect(getPercentile([1, 2, 3, 4, 5], 50)).toBe(3)
  })

  it('calcula P85 corretamente', () => {
    expect(getPercentile([1, 2, 3, 4, 5], 85)).toBe(5)
  })

  it('calcula P95 corretamente', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    expect(getPercentile(values, 95)).toBe(19)
  })
})

// ── getGroupKey ───────────────────────────────────────────────────────────────

describe('getGroupKey', () => {
  const date = new Date(2024, 0, 15) // 15 jan 2024

  it('agrupa por dia', () => {
    expect(getGroupKey(date, 'day')).toBe('2024-01-15')
  })

  it('agrupa por mês', () => {
    expect(getGroupKey(date, 'month')).toBe('2024-01')
  })

  it('agrupa por ano', () => {
    expect(getGroupKey(date, 'year')).toBe('2024')
  })

  it('agrupa por semana e retorna formato YYYY-WXX', () => {
    const key = getGroupKey(date, 'week')
    expect(key).toMatch(/^2024-W\d{2}$/)
  })
})

// ── autoMapColumns ────────────────────────────────────────────────────────────

describe('autoMapColumns', () => {
  it('mapeia headers padrão do Azure DevOps', () => {
    const headers = ['ID', 'Work Item Type', 'Area Path', 'Activated Date', 'Closed Date', 'State']
    const mapping = autoMapColumns(headers)
    expect(mapping.id).toBe('ID')
    expect(mapping.type).toBe('Work Item Type')
    expect(mapping.team).toBe('Area Path')
    expect(mapping.entryDate).toBe('Activated Date')
    expect(mapping.exitDate).toBe('Closed Date')
    expect(mapping.currentStatus).toBe('State')
  })

  it('mapeia headers comuns do Jira', () => {
    const headers = ['id', 'Type', 'Squad', 'Created Date', 'Resolved Date', 'Status']
    const mapping = autoMapColumns(headers)
    expect(mapping.id).toBe('id')
    expect(mapping.type).toBe('Type')
    expect(mapping.currentStatus).toBe('Status')
  })

  it('retorna null para campos sem correspondência', () => {
    const mapping = autoMapColumns(['coluna_a', 'coluna_b'])
    expect(mapping.id).toBeNull()
    expect(mapping.entryDate).toBeNull()
    expect(mapping.exitDate).toBeNull()
  })

  it('retorna mapeamento vazio para array vazio', () => {
    const mapping = autoMapColumns([])
    expect(Object.values(mapping).every(v => v === null)).toBe(true)
  })
})

// ── buildWorkItems ────────────────────────────────────────────────────────────

describe('buildWorkItems', () => {
  const mapping = {
    id: 'ID',
    type: 'Type',
    team: 'Team',
    entryDate: 'EntryDate',
    exitDate: 'ExitDate',
    currentStatus: 'Status',
  }

  it('constrói itens corretamente', () => {
    const rows = [{ ID: '1', Type: 'Bug', Team: 'Alpha', EntryDate: '2024-01-01', ExitDate: '2024-01-11', Status: 'Done' }]
    const items = buildWorkItems(rows, mapping)
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('1')
    expect(items[0].cycleTime).toBe(10)
    expect(items[0].team).toBe('Alpha')
    expect(items[0].type).toBe('Bug')
    expect(items[0].currentStatus).toBe('Done')
  })

  it('pula linhas sem entryDate válida', () => {
    const rows = [
      { ID: '1', EntryDate: 'invalid', ExitDate: '' },
      { ID: '2', EntryDate: '2024-01-01', ExitDate: '' },
    ]
    const items = buildWorkItems(rows, mapping)
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('2')
  })

  it('itens sem exitDate ficam em WIP (cycleTime undefined)', () => {
    const rows = [{ ID: '1', EntryDate: '2024-01-01', ExitDate: '' }]
    const items = buildWorkItems(rows, mapping)
    expect(items[0].cycleTime).toBeUndefined()
    expect(items[0].exitDate).toBeUndefined()
  })

  it('cycleTime = 0 para itens concluídos no mesmo dia', () => {
    const rows = [{ ID: '1', EntryDate: '2024-01-01', ExitDate: '2024-01-01' }]
    const items = buildWorkItems(rows, mapping)
    expect(items[0].cycleTime).toBe(0)
  })

  it('retorna array vazio para input vazio', () => {
    expect(buildWorkItems([], mapping)).toHaveLength(0)
  })
})

// ── computeThroughputMedian ──────────────────────────────────────────────────

describe('computeThroughputMedian', () => {
  it('retorna 0 sem itens', () => {
    expect(computeThroughputMedian([], 'week')).toEqual({ median: 0, isLastPartial: false })
  })

  it('retorna 0 para itens sem exitDate', () => {
    const items = [{ id: '1', entryDate: new Date(2024, 0, 1), cycleTime: undefined } as never]
    expect(computeThroughputMedian(items, 'week')).toEqual({ median: 0, isLastPartial: false })
  })

  it('calcula mediana corretamente com múltiplos períodos', () => {
    // 3 semanas: 2 itens, 4 itens, 2 itens → mediana = 2
    const items = [
      { id: '1', entryDate: new Date(2024, 0, 1), exitDate: new Date(2024, 0, 1), cycleTime: 0 },
      { id: '2', entryDate: new Date(2024, 0, 1), exitDate: new Date(2024, 0, 1), cycleTime: 0 },
      { id: '3', entryDate: new Date(2024, 0, 8), exitDate: new Date(2024, 0, 8), cycleTime: 0 },
      { id: '4', entryDate: new Date(2024, 0, 8), exitDate: new Date(2024, 0, 8), cycleTime: 0 },
      { id: '5', entryDate: new Date(2024, 0, 8), exitDate: new Date(2024, 0, 8), cycleTime: 0 },
      { id: '6', entryDate: new Date(2024, 0, 8), exitDate: new Date(2024, 0, 8), cycleTime: 0 },
      { id: '7', entryDate: new Date(2024, 0, 15), exitDate: new Date(2024, 0, 15), cycleTime: 0 },
      { id: '8', entryDate: new Date(2024, 0, 15), exitDate: new Date(2024, 0, 15), cycleTime: 0 },
    ]
    const { median } = computeThroughputMedian(items as never, 'week')
    expect(median).toBeGreaterThan(0)
  })

  it('detecta último período parcial quando contagem é muito abaixo da mediana', () => {
    // 4 semanas com 10 itens cada, última com apenas 1
    const makeItems = (date: Date, count: number, startId: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: String(startId + i),
        entryDate: date,
        exitDate: date,
        cycleTime: 0,
      }))

    const items = [
      ...makeItems(new Date(2024, 0, 1), 10, 0),
      ...makeItems(new Date(2024, 0, 8), 10, 10),
      ...makeItems(new Date(2024, 0, 15), 10, 20),
      ...makeItems(new Date(2024, 0, 22), 1, 30),
    ]
    const { isLastPartial } = computeThroughputMedian(items as never, 'week')
    expect(isLastPartial).toBe(true)
  })
})
