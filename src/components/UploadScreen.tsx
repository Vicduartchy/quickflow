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
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Hero */}
        <div className="mb-8 text-center">
          <img src="/quickflow/logo-dark.png" alt="Vic Duarte" className="h-12 object-contain mx-auto mb-5" />
          <h1 className="text-4xl font-bold text-[#092140] mb-3">QuickFlow</h1>
          <p className="text-lg text-[#BF452A] font-medium mb-4">Métricas de fluxo ágil, sem complicação.</p>
          <p className="text-[#555] text-sm leading-relaxed max-w-xl mx-auto">
            O <strong>QuickFlow</strong> transforma sua planilha do Azure DevOps, Jira ou Trello em um dashboard completo de gestão de fluxo —
            com <strong>Cycle Time</strong>, <strong>Throughput</strong>, <strong>Aging WIP</strong> e muito mais.
            Tudo direto no seu navegador, sem cadastro, sem servidor, sem custo.
          </p>
        </div>

        {/* Cards de benefício */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
          {[
            { Icon: IconBarChart, title: 'Cycle Time & Throughput', desc: 'Percentis P50, P85, P95 e mediana de entregas por período.' },
            { Icon: IconClock, title: 'Aging WIP', desc: 'Veja quais itens estão envelhecendo além do limite saudável.' },
            { Icon: IconLock, title: '100% Privado', desc: 'Seus dados nunca saem do seu navegador.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white border border-[#F2C5BB] rounded-xl p-4 shadow-sm">
              <div className="flex justify-center mb-2"><Icon size={24} className="text-[#BF452A]" /></div>
              <div className="text-xs font-bold text-[#092140] mb-1">{title}</div>
              <div className="text-xs text-[#888] leading-snug">{desc}</div>
            </div>
          ))}
        </div>

        {/* Upload */}
        <h2 className="text-base font-semibold text-[#092140] mb-3">{t.upload.title}</h2>
        <p className="text-[#D99789] text-sm mb-4">{t.upload.subtitle}</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${dragging ? 'border-[#BF452A] bg-[#F2C5BB]/20' : 'border-[#D99789] hover:border-[#BF452A] hover:bg-[#F2C5BB]/10'}`}
        >
          <div className="flex justify-center mb-4"><IconBarChart size={44} className="text-[#D99789]" /></div>
          <p className="text-[#092140] font-semibold mb-1">{t.upload.button}</p>
          <p className="text-[#D99789] text-sm">{t.upload.or}</p>
          <p className="text-[#D99789] text-xs mt-2">.csv, .xlsx</p>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileChange} />
        </div>
        {loading && <div className="mt-4 text-center text-[#BF452A] font-medium animate-pulse">Processando arquivo...</div>}
        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Aviso de privacidade */}
        <div className="mt-5 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs">
          <IconWarning size={15} className="shrink-0 mt-0.5 text-amber-600" />
          <span>
            <strong>Seus dados ficam apenas no seu navegador.</strong> O QuickFlow não envia nem armazena nenhuma informação em servidores. Se você atualizar ou fechar a página, os dados serão perdidos.
          </span>
        </div>

        {/* CTA da criadora */}
        <div className="mt-8 bg-[#092140] rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4">
          <img src="/quickflow/logo-white.png" alt="Vic Duarte" className="h-10 object-contain shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-white text-sm font-semibold mb-0.5">Criado por Vic Duarte</p>
            <p className="text-[#D99789] text-xs leading-snug">
              Especialista em gestão estratégica e aprendizagem. Ajuda times e organizações a usarem dados de fluxo para tomar decisões melhores e entregar mais valor.
            </p>
          </div>
          <a
            href="https://vicduarte.site/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 bg-[#BF452A] hover:bg-[#a33a22] text-white text-xs font-bold rounded-full transition-colors whitespace-nowrap"
          >
            <span className="flex items-center gap-1.5">Conheça o trabalho <IconExternalLink size={12} /></span>
          </a>
        </div>
      </div>
    </div>
  )
}
