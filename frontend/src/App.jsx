import { Route, Router, Routes, useNavigate } from "react-router"
import "./App.css"
import LandingPage from "./pages/LandingPage"
import Authentication from "./pages/authentication"
import { AuthProvider } from "./context/AuthContext"
import VedioMeet from "./pages/VedioMeet"

function App() {
  return (
    <>
      <AuthProvider>
        <Routes>
          {/* <Route path="/home" element={} /> */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authentication />} />
          <Route path="/home" element={<Authentication />} />
          <Route path="/:url" element={<VedioMeet />} />
        </Routes>
      </AuthProvider>
    </>
  )
}

export default App
