import type { WorkItem } from '../types'

export const STORAGE_KEYS = {
  workItems: 'qf_workItems',
  mapping: 'qf_mapping',
  flowPolicy: 'qf_flowPolicy',
  headers: 'qf_headers',
} as const

export function loadWorkItems(): WorkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.workItems)
    if (!raw) return []
    return (JSON.parse(raw) as Array<Record<string, unknown>>).map(item => ({
      ...item,
      entryDate: new Date(item.entryDate as string),
      exitDate: item.exitDate ? new Date(item.exitDate as string) : undefined,
    })) as WorkItem[]
  } catch { return [] }
}

export function saveWorkItems(items: WorkItem[]) {
  localStorage.setItem(STORAGE_KEYS.workItems, JSON.stringify(items.map(i => ({
    ...i,
    entryDate: i.entryDate.toISOString(),
    exitDate: i.exitDate?.toISOString(),
  }))))
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch { return fallback }
}
