import { useApp } from '../lib/context'

export default function Navbar() {
  const { lang, toggleLang, resetAll, step } = useApp()
  return (
    <nav className="bg-[#092140] text-white px-6 py-3 flex items-center justify-between shadow">
      <button onClick={resetAll} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/quickflow/logo-white.png" alt="Vic Duarte" className="h-8 object-contain" />
        <span className="font-bold text-lg tracking-tight">QuickFlow</span>
        <span className="text-xs bg-[#BF452A] px-2 py-0.5 rounded-full ml-1">beta</span>
      </button>
      <div className="flex items-center gap-4">
        {step !== 'upload' && (
          <span className="text-[#D99789] text-sm">
            {step === 'mapping' && '① Mapeamento'}
            {step === 'policy' && '② Política de Fluxo'}
            {step === 'dashboard' && '③ Dashboard'}
          </span>
        )}
        <button onClick={toggleLang} className="text-sm text-[#D99789] hover:text-white border border-[#D99789] hover:border-white px-3 py-1 rounded transition-colors">
          {lang === 'pt-BR' ? 'EN' : 'PT'}
        </button>
      </div>
    </nav>
  )
}
