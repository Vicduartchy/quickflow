import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { WorkItem } from '../types'

// localStorage mock em memória — sem depender de jsdom
function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
}

const localStorageMock = createLocalStorageMock()
vi.stubGlobal('localStorage', localStorageMock)

// Importar DEPOIS de stubGlobal para que o módulo veja o mock
const { loadWorkItems, saveWorkItems, loadJson } = await import('./storage')

beforeEach(() => {
  localStorageMock.clear()
})

// ── saveWorkItems / loadWorkItems ─────────────────────────────────────────────

describe('saveWorkItems / loadWorkItems', () => {
  it('retorna array vazio quando localStorage está limpo', () => {
    expect(loadWorkItems()).toEqual([])
  })

  it('salva e recupera itens com datas preservadas', () => {
    const items: WorkItem[] = [
      {
        id: '1',
        entryDate: new Date(2024, 0, 1),
        exitDate: new Date(2024, 0, 11),
        cycleTime: 10,
        type: 'Bug',
        team: 'Alpha',
        currentStatus: 'Done',
      },
    ]
    saveWorkItems(items)
    const loaded = loadWorkItems()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('1')
    expect(loaded[0].entryDate).toBeInstanceOf(Date)
    expect(loaded[0].entryDate.getFullYear()).toBe(2024)
    expect(loaded[0].entryDate.getMonth()).toBe(0)
    expect(loaded[0].entryDate.getDate()).toBe(1)
    expect(loaded[0].exitDate).toBeInstanceOf(Date)
    expect(loaded[0].cycleTime).toBe(10)
    expect(loaded[0].type).toBe('Bug')
    expect(loaded[0].team).toBe('Alpha')
  })

  it('preserva itens em WIP (exitDate = undefined)', () => {
    const items: WorkItem[] = [
      { id: '2', entryDate: new Date(2024, 5, 1), cycleTime: undefined },
    ]
    saveWorkItems(items)
    const loaded = loadWorkItems()
    expect(loaded[0].exitDate).toBeUndefined()
    expect(loaded[0].cycleTime).toBeUndefined()
  })

  it('retorna array vazio para JSON corrompido no localStorage', () => {
    localStorageMock.setItem('qf_workItems', 'isto não é json válido}}}')
    expect(loadWorkItems()).toEqual([])
  })

  it('round-trip com múltiplos itens mantém todos', () => {
    const items: WorkItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      entryDate: new Date(2024, 0, i + 1),
      cycleTime: i % 3 === 0 ? undefined : i,
    }))
    saveWorkItems(items)
    const loaded = loadWorkItems()
    expect(loaded).toHaveLength(50)
    loaded.forEach(item => expect(item.entryDate).toBeInstanceOf(Date))
  })
})

// ── loadJson ──────────────────────────────────────────────────────────────────

describe('loadJson', () => {
  it('retorna fallback quando chave não existe', () => {
    expect(loadJson('chave_inexistente', { x: 1 })).toEqual({ x: 1 })
  })

  it('retorna fallback para JSON inválido', () => {
    localStorageMock.setItem('chave_ruim', 'não é json')
    expect(loadJson('chave_ruim', 42)).toBe(42)
  })

  it('carrega valor salvo corretamente', () => {
    localStorageMock.setItem('chave_boa', JSON.stringify({ groupBy: 'week' }))
    expect(loadJson('chave_boa', {})).toEqual({ groupBy: 'week' })
  })

  it('retorna fallback de array vazio', () => {
    expect(loadJson<string[]>('vazio', [])).toEqual([])
  })
})
