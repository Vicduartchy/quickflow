import { useApp } from '../lib/context'
import { buildWorkItems } from '../lib/mapping'
import type { ColumnMapping } from '../types'
import { Button } from './ui/button'

const FIELDS: Array<{ key: keyof ColumnMapping; labelKey: string; required?: boolean }> = [
  { key: 'id', labelKey: 'id' },
  { key: 'type', labelKey: 'type' },
  { key: 'team', labelKey: 'team' },
  { key: 'entryDate', labelKey: 'entryDate', required: true },
  { key: 'exitDate', labelKey: 'exitDate' },
  { key: 'currentStatus', labelKey: 'currentStatus' },
]

export default function MappingScreen() {
  const { t, headers, mapping, setMapping, rawRows, setWorkItems, setStep } = useApp()

  function onChange(field: keyof ColumnMapping, value: string) {
    setMapping({ ...mapping, [field]: value === '' ? null : value })
  }

  function onContinue() {
    const items = buildWorkItems(rawRows, mapping)
    setWorkItems(items)
    setStep('policy')
  }

  const canContinue = mapping.entryDate !== null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#092140] mb-2">{t.mapping.title}</h1>
      <p className="text-[#D99789] mb-8">{t.mapping.subtitle}</p>
      <div className="bg-white rounded-xl shadow-sm border border-[#F2C5BB] overflow-hidden">
        {FIELDS.map(({ key, labelKey, required }) => (
          <div key={key} className="flex items-center gap-4 px-6 py-4 border-b border-[#F2F2F2] last:border-0">
            <div className="w-40 text-sm font-medium text-[#092140]">
              {t.mapping[labelKey as keyof typeof t.mapping]}
              {required && <span className="text-[#BF452A] ml-1">*</span>}
            </div>
            <select
              value={mapping[key] ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              className="flex-1 border border-[#D99789] rounded-lg px-3 py-2 text-sm text-[#092140] focus:outline-none focus:border-[#BF452A]"
            >
              <option value="">{t.mapping.none}</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => setStep('upload')}>
          {t.mapping.back}
        </Button>
        <Button onClick={onContinue} disabled={!canContinue}>
          {t.mapping.next}
        </Button>
      </div>
    </div>
  )
}
