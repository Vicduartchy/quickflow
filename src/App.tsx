import { AppProvider, useApp } from "./lib/context"
import UploadScreen from "./components/UploadScreen"
import MappingScreen from "./components/MappingScreen"
import PolicyScreen from "./components/PolicyScreen"
import DashboardScreen from "./components/DashboardScreen"
import Navbar from "./components/Navbar"

function Inner() {
  const { step } = useApp()
  return (
    <div className="min-h-screen bg-[#F2F2F2] font-sans">
      <Navbar />
      {step === "upload" && <UploadScreen />}
      {step === "mapping" && <MappingScreen />}
      {step === "policy" && <PolicyScreen />}
      {step === "dashboard" && <DashboardScreen />}
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
