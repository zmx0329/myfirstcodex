import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CapturePage from './pages/Capture'
import CollectionPage from './pages/Collection'
import HomePage from './pages/Home'
import './App.css'

const App = () => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
