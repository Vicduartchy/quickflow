import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../lib/context'
import { autoMapColumns, buildWorkItems } from '../lib/mapping'

export default function UploadScreen() {
  const { t, setStep, setRawRows, setHeaders, setWorkItems, setMapping } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function processFile(file: File) {
    setError(null)
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        // CSVs devem ser lidos com raw:true para preservar datas como texto
        // XLSX/XLS usam cellDates:true para converter seriais corretamente
        const isCSV = file.name.toLowerCase().endsWith('.csv')
        const wb = isCSV
          ? XLSX.read(data, { type: 'array', raw: true })
          : XLSX.read(data, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: isCSV })
        if (rows.length === 0) {
          setError('Arquivo vazio ou sem dados.')
          setLoading(false)
          return
        }
        const headers = Object.keys(rows[0])
        const mapping = autoMapColumns(headers)
        const items = buildWorkItems(rows, mapping)
        setRawRows(rows)
        setHeaders(headers)
        setMapping(mapping)
        setWorkItems(items)
        setStep('mapping')
      } catch {
        setError('Erro ao ler o arquivo. Verifique se é um CSV ou XLSX válido.')
      }
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-[#092140] mb-2">{t.upload.title}</h1>
        <p className="text-[#D99789] mb-8">{t.upload.subtitle}</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${dragging ? 'border-[#BF452A] bg-[#F2C5BB]/20' : 'border-[#D99789] hover:border-[#BF452A] hover:bg-[#F2C5BB]/10'}`}
        >
          <div className="text-5xl mb-4">📊</div>
          <p className="text-[#092140] font-semibold mb-1">{t.upload.button}</p>
          <p className="text-[#D99789] text-sm">{t.upload.or}</p>
          <p className="text-[#D99789] text-xs mt-2">.csv, .xlsx</p>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileChange} />
        </div>
        {loading && <div className="mt-4 text-center text-[#BF452A] font-medium animate-pulse">Processando arquivo...</div>}
        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      </div>
    </div>
  )
}
