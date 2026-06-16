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

function Inner() {
  const { step } = useApp()
  return (
    <div className="min-h-screen bg-[#F2F2F2] font-sans">
      <Navbar />
      {step === "upload" && <UploadScreen />}
      {step === "mapping" && <MappingScreen />}
      {step === "policy" && <PolicyScreen />}
      {step === "dashboard" && <DashboardScreen />}
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
