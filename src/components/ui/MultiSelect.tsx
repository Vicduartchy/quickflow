import { useState, useRef, useEffect } from 'react'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  lang?: string
}

export function MultiSelect({ label, options, selected, onChange, placeholder, lang = 'pt-BR' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const sortedOptions = [...options].sort((a, b) => a.localeCompare(b, lang === 'pt-BR' ? 'pt' : 'en', { sensitivity: 'base' }))
  const filtered = search.trim()
    ? sortedOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : sortedOptions

  const toggle = (val: string) => onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val])
  const clearLabel = lang === 'pt-BR' ? 'Limpar' : 'Clear'
  const allLabel = lang === 'pt-BR' ? 'Todos' : 'All'
  const searchLabel = lang === 'pt-BR' ? 'Buscar...' : 'Search...'
  const selectedLabel = selected.length === 0
    ? (placeholder ?? allLabel)
    : `${selected.length} ${lang === 'pt-BR' ? 'selecionado(s)' : 'selected'}`

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-[#D99789] block mb-1">{label}</label>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-xl border transition-colors min-w-[160px] max-w-[260px] w-full ${open ? 'border-[#BF452A] bg-white' : 'border-[#D99789] bg-[#F2F2F2]'} text-[#092140]`}
      >
        <span className={`truncate text-xs ${selected.length === 0 ? 'text-[#D99789]' : 'text-[#092140] font-semibold'}`}>{selectedLabel}</span>
        <svg className={`w-3.5 h-3.5 shrink-0 text-[#D99789] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-white border border-[#F2C5BB] rounded-xl shadow-xl">
          {/* Search input */}
          <div className="px-3 py-2 border-b border-[#F2C5BB]">
            <div className="flex items-center gap-2 bg-[#F2F2F2] rounded-lg px-2 py-1.5">
              <svg className="w-3.5 h-3.5 text-[#D99789] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchLabel}
                className="bg-transparent text-xs text-[#092140] outline-none w-full placeholder-[#D99789]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-[#D99789] hover:text-[#BF452A]">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Header with count and clear */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#F2C5BB]">
            <span className="text-xs text-[#D99789]">
              {filtered.length} {lang === 'pt-BR' ? 'opções' : 'options'}
              {selected.length > 0 && ` · ${selected.length} ${lang === 'pt-BR' ? 'selecionado(s)' : 'selected'}`}
            </span>
            {selected.length > 0 && (
              <button onClick={() => onChange([])} className="text-xs text-[#BF452A] hover:underline font-medium">{clearLabel}</button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-[#D99789] text-center py-4">{lang === 'pt-BR' ? 'Nenhuma opção encontrada' : 'No options found'}</p>
            ) : (
              filtered.map(opt => (
                <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F2C5BB]/20 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                    className="accent-[#BF452A] w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-xs text-[#092140] leading-tight">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
