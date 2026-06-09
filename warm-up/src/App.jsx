import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hub from './components/Hub'
import QuickGrid from './games/QuickGrid/QuickGrid'
import ComingSoon from './games/comingsoon/comingsoon'

function App() {
  return (
    <BrowserRouter basename="/WarmUpGames">
      <Navbar />
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/quickgrid" element={<QuickGrid />} />
        <Route path="/comingsoon" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
