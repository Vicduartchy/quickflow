import { useApp } from '../lib/context'
import { buildWorkItems, computeChartAvailability } from '../lib/mapping'
import type { ColumnMapping } from '../types'

const FIELDS: (keyof ColumnMapping)[] = ['id', 'type', 'team', 'entryDate', 'exitDate', 'currentStatus']
const REQUIRED: (keyof ColumnMapping)[] = ['entryDate']

export function MappingScreen() {
  const { t, lang, rawHeaders, rawRows, mapping, setMapping, setWorkItems, setAvailability, setStep } = useApp()

  const handleChange = (field: keyof ColumnMapping, value: string) => setMapping({ ...mapping, [field]: value === '' ? null : value })

  const handleGenerate = () => {
    setWorkItems(buildWorkItems(rawRows, mapping))
    setAvailability(computeChartAvailability(mapping))
    setStep('policy')
  }

  const canGenerate = !!mapping.entryDate
  const backLabel = lang === 'pt-BR' ? '← Voltar' : '← Back'
  const noMapMsg = lang === 'pt-BR' ? 'Mapeie ao menos a "Data de entrada no fluxo" para continuar.' : 'Map at least the "Flow entry date" to continue.'

  const fieldLabels: Record<keyof ColumnMapping, string> = lang === 'pt-BR' ? {
    id: 'ID do item',
    type: 'Tipo de item',
    team: 'Time / Squad / Projeto',
    entryDate: 'Data de entrada no fluxo',
    exitDate: 'Data de conclusão',
    currentStatus: 'Status atual',
  } : {
    id: 'Item ID',
    type: 'Item type',
    team: 'Team / Squad / Project',
    entryDate: 'Flow entry date',
    exitDate: 'Completion date',
    currentStatus: 'Current status',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#F2F2F2]">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#092140] mb-2">{t.mappingTitle}</h1>
          <p className="text-[#D99789]">{t.mappingSubtitle}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#F2C5BB] overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 text-xs font-semibold text-[#D99789] uppercase tracking-wider px-6 py-3 border-b border-[#F2C5BB] bg-[#F2F2F2]">
            <span>{t.mappingField}</span><span>{t.mappingColumn}</span><span className="text-right">Tipo</span>
          </div>
          {FIELDS.map((field) => {
            const isRequired = REQUIRED.includes(field)
            return (
              <div key={field} className="grid grid-cols-3 items-center px-6 py-4 border-b border-[#F2C5BB]/50 last:border-0 hover:bg-[#F2C5BB]/10 transition-colors">
                <p className="text-[#092140] text-sm font-medium">{fieldLabels[field]}</p>
                <select value={mapping[field] ?? ''} onChange={(e) => handleChange(field, e.target.value)}
                  className="bg-[#F2F2F2] border border-[#D99789] text-[#092140] text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:border-[#BF452A] transition-colors">
                  <option value="">{t.mappingNotMapped}</option>
                  {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${isRequired ? 'bg-[#BF452A]/10 text-[#BF452A]' : 'bg-[#F2C5BB]/40 text-[#D99789]'}`}>
                    {isRequired ? t.mappingRequired : t.mappingOptional}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setStep('upload')} className="flex-1 py-3 rounded-xl border border-[#D99789] text-[#D99789] hover:text-[#092140] hover:border-[#092140] transition-colors text-sm font-medium">{backLabel}</button>
          <button onClick={handleGenerate} disabled={!canGenerate}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${canGenerate ? 'bg-[#BF452A] hover:bg-[#092140] text-white' : 'bg-[#F2C5BB] text-[#D99789] cursor-not-allowed'}`}>
            {t.mappingGenerate} →
          </button>
        </div>
        {!canGenerate && <p className="text-[#BF452A] text-xs text-center mt-3">{noMapMsg}</p>}
      </div>
    </div>
  )
}
