import React, { useCallback, useState } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../lib/context'
import { inferColumnMapping, buildWorkItems, computeChartAvailability } from '../lib/mapping'

export function UploadScreen() {
  const { t, lang, setStep, setRawHeaders, setRawRows, setMapping, setWorkItems, setAvailability } = useApp()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const processFile = useCallback((file: File) => {
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext ?? '')) { setError('Formato inválido. Use .csv, .xlsx ou .xls.'); return }
    setLoading(true); setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const wb = XLSX.read(data, { type: 'binary', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
        if (!rows.length) { setError('Planilha vazia.'); setLoading(false); return }
        const headers = Object.keys(rows[0])
        const { mapping } = inferColumnMapping(headers)
        setRawHeaders(headers); setRawRows(rows); setMapping(mapping)
        setWorkItems(buildWorkItems(rows, mapping))
        setAvailability(computeChartAvailability(mapping))
        setStep('mapping')
      } catch { setError('Erro ao ler o arquivo.') }
      setLoading(false)
    }
    reader.readAsBinaryString(file)
  }, [setStep, setRawHeaders, setRawRows, setMapping, setWorkItems, setAvailability])

  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }, [processFile])

  const authorText = lang === 'pt-BR'
    ? 'Quer conhecer mais sobre métricas de fluxo, agilidade e gestão de projetos?'
    : 'Want to learn more about flow metrics, agility and project management?'
  const authorLink = lang === 'pt-BR' ? 'Acesse o site da autora →' : 'Visit the author\'s website →'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#F2F2F2]">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-[#092140] mb-3 tracking-tight">{t.uploadTitle}</h1>
          <p className="text-[#D99789] text-lg leading-relaxed">{t.uploadSubtitle}</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${dragging ? 'border-[#BF452A] bg-[#F2C5BB]/20' : 'border-[#D99789] hover:border-[#BF452A] bg-white'}`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-[#BF452A]' : 'bg-[#F2C5BB]/40'}`}>
              <svg className={`w-8 h-8 ${dragging ? 'text-white' : 'text-[#BF452A]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[#092140] font-medium text-lg">{t.uploadDrag}</p>
              <p className="text-[#D99789] text-sm mt-1">{t.uploadOr}</p>
            </div>
            <button className="px-6 py-2.5 bg-[#BF452A] hover:bg-[#092140] text-white font-semibold rounded-xl transition-colors text-sm" onClick={(e) => { e.stopPropagation(); document.getElementById('file-input')?.click() }}>
              {loading ? '...' : t.uploadButton}
            </button>
            <p className="text-[#D99789] text-xs">{t.uploadFormats}</p>
          </div>
        </div>

        {error && <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm text-center">{error}</div>}

        <div className="mt-4 p-4 bg-[#F2C5BB]/30 border border-[#D99789]/50 rounded-xl">
          <p className="text-[#BF452A] text-sm text-center">{t.uploadWarning}</p>
        </div>

        {/* Author credit */}
        <div className="mt-6 p-4 bg-white border border-[#F2C5BB] rounded-2xl flex items-center gap-4">
          <img src="/quickflow/vic-logo.svg" alt="Vic Duarte" className="h-8 shrink-0" />
          <div>
            <p className="text-[#092140] text-sm">{authorText}</p>
            <a href="https://vicduarte.site" target="_blank" rel="noopener noreferrer" className="text-[#BF452A] text-sm font-semibold hover:underline">{authorLink}</a>
          </div>
        </div>
      </div>
    </div>
  )
}
