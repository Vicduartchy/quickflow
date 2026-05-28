import { useApp } from '../lib/context'

export function Navbar() {
  const { t, toggleLang, step } = useApp()
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F2C5BB] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/quickflow/vic-logo.png" alt="Vic Duarte" className="h-8" />
          <div className="w-px h-6 bg-[#F2C5BB]" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-[#BF452A] flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-[#092140] font-bold tracking-tight text-sm">QuickFlow</span>
          </div>
          {step === 'upload' && <span className="hidden sm:inline text-[#D99789] text-xs ml-1">— {t.appTagline}</span>}
        </div>
        <button onClick={toggleLang} className="px-3 py-1 text-xs font-semibold text-[#BF452A] hover:text-white hover:bg-[#BF452A] border border-[#BF452A] rounded-lg transition-colors">
          {t.langToggle}
        </button>
      </div>
    </nav>
  )
}
