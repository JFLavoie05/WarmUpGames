import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hub from './components/Hub'
import QuickGrid from './games/QuickGrid/QuickGrid'
import ColorRush from './games/ColorRush/ColorRush'
import KeyRush from './games/KeyRush/KeyRush'
import ChimpTest from './games/ChimpTest/ChimpTest'
import RhythmGrid from './games/RhythmGrid/RhythmGrid'
import ComingSoon from './games/comingsoon/comingsoon'

function App() {
  return (
    <BrowserRouter basename="/WarmUpGames">
      <Navbar />
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/quickgrid" element={<QuickGrid />} />
        <Route path="/colorrush" element={<ColorRush />} />
        <Route path="/keyrush" element={<KeyRush />} />
        <Route path="/chimptest" element={<ChimpTest />} />
        <Route path="/rhythmgrid" element={<RhythmGrid />} />
        <Route path="/comingsoon" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
