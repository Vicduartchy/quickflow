import { useEffect, useState } from "react"
import { AppProvider, useApp } from "./lib/context"
import UploadScreen from "./components/UploadScreen"
import MappingScreen from "./components/MappingScreen"
import PolicyScreen from "./components/PolicyScreen"
import DashboardScreen from "./components/DashboardScreen"
import Navbar from "./components/Navbar"

function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 bg-[#092140] hover:bg-[#0d2f5e] text-white rounded-full w-11 h-11 flex items-center justify-center shadow-lg transition-all duration-200 print:hidden"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  )
}

function Footer() {
  return (
    <footer className="bg-[#092140] text-white mt-12 py-6 px-6 print:hidden">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logos */}
        <div className="flex items-center gap-3">
          <img src="/quickflow/quickflow-logo-dark.png" alt="QuickFlow" className="h-10 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="text-white/30 text-lg font-thin select-none">|</span>
          <img src="/quickflow/logo-white.png" alt="Vic Duarte" className="h-7 object-contain" />
        </div>

        {/* Copyright */}
        <p className="text-[#D99789] text-xs text-center sm:text-right leading-relaxed">
          © 2026 <a href="https://vicduarte.site/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">Vic Duarte</a>.
          Todos os direitos reservados.{' '}
          <span className="text-white/40">QuickFlow é uma ferramenta open source e gratuita.</span>
        </p>
      </div>
    </footer>
  )
}

function Inner() {
  const { step } = useApp()
  return (
    <div className="min-h-screen bg-[#F2F2F2] font-sans flex flex-col">
      <Navbar />
      <main className="flex-1">
        {step === "upload" && <UploadScreen />}
        {step === "mapping" && <MappingScreen />}
        {step === "policy" && <PolicyScreen />}
        {step === "dashboard" && <DashboardScreen />}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
