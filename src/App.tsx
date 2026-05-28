
import { AppProvider, useApp } from './lib/context'
import { Navbar } from './components/Navbar'
import { UploadScreen } from './components/UploadScreen'
import { MappingScreen } from './components/MappingScreen'
import { DashboardScreen } from './components/DashboardScreen'

function AppShell() {
  const { step } = useApp()

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main className="pt-14">
        {step === 'upload' && <UploadScreen />}
        {step === 'mapping' && <MappingScreen />}
        {step === 'dashboard' && <DashboardScreen />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
