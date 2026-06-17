import { useApp } from '../lib/context'
import { IconArrowLeft } from './Icons'

export default function Navbar() {
  const { lang, toggleLang, resetAll, step } = useApp()
  return (
    <nav className="bg-[#092140] text-white px-6 py-3 flex items-center justify-between shadow">
      <button onClick={resetAll} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        {/* Logo QuickFlow (nova identidade) */}
        <img src="/quickflow/quickflow-logo-white.png" alt="QuickFlow" className="h-8 object-contain" />
        {/* Separador */}
        <span className="text-white/30 text-lg font-thin select-none">|</span>
        {/* Logo Vic Duarte */}
        <img src="/quickflow/logo-white.png" alt="Vic Duarte" className="h-6 object-contain opacity-80" />
      </button>
      <div className="flex items-center gap-4">
        {step !== 'upload' && (
          <span className="text-[#D99789] text-sm">
            {step === 'mapping' && '① Mapeamento'}
            {step === 'policy' && '② Política de Fluxo'}
            {step === 'dashboard' && '③ Dashboard'}
          </span>
        )}
        {step !== 'upload' && (
          <button
            onClick={resetAll}
            className="text-sm font-medium bg-[#BF452A] hover:bg-[#a33a22] text-white px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            <IconArrowLeft size={14} /> Nova análise
          </button>
        )}
        <button onClick={toggleLang} className="text-sm text-[#D99789] hover:text-white border border-[#D99789] hover:border-white px-3 py-1 rounded transition-colors">
          {lang === 'pt-BR' ? 'EN' : 'PT'}
        </button>
      </div>
    </nav>
  )
}
