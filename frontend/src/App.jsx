import { Route, Router, Routes } from "react-router-dom"
import "./App.css"
import LandingPage from "./pages/LandingPage"
import Authentication from "./pages/authentication"
import { AuthProvider } from "./context/AuthContext"
import VedioMeet from "./pages/VedioMeet"
import Home from "./pages/Home"
import History from "./pages/History"

function App() {
  return (
    <>
      <AuthProvider>
        <Routes>
          {/* <Route path="/home" element={} /> */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/home" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/:url" element={<VedioMeet />} />
        </Routes>
      </AuthProvider>
    </>
  )
}

export default App
