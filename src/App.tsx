import { AppProvider, useApp } from './lib/context'
import { Navbar } from './components/Navbar'
import { UploadScreen } from './components/UploadScreen'
import { MappingScreen } from './components/MappingScreen'
import { PolicyScreen } from './components/PolicyScreen'
import { DashboardScreen } from './components/DashboardScreen'

function AppShell() {
  const { step } = useApp()
  return (
    <div className="min-h-screen bg-[#F2F2F2] text-[#092140]">
      <Navbar />
      <main className="pt-14">
        {step === 'upload' && <UploadScreen />}
        {step === 'mapping' && <MappingScreen />}
        {step === 'policy' && <PolicyScreen />}
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
