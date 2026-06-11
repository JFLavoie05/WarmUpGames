import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toggleMute, isMuted, setVolume, getVolume } from '../sounds'
import './Navbar.css'

const IconSoundHigh = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
)

const IconSoundLow = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    </svg>
)

const IconSoundOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
)

export default function Navbar() {
    const location = useLocation()
    const isHome = location.pathname === '/'
    const [muted, setMuted] = useState(isMuted())
    const [volume, setVolumeState] = useState(() => Math.round(getVolume() * 100))

    const handleMuteToggle = () => {
        const next = toggleMute()
        setMuted(next)
    }

    const handleVolumeChange = (e) => {
        const val = parseInt(e.target.value)
        setVolumeState(val)
        setVolume(val / 100)
    }

    const silent = muted || volume === 0
    const SoundIcon = silent ? IconSoundOff : volume < 50 ? IconSoundLow : IconSoundHigh

    return (
        <nav className="navbar">
            {!isHome && (
                <Link to="/" className="navbar-back">
                    &#8592;
                </Link>
            )}
            <Link to="/" className="navbar-logo">
                <img src={`${import.meta.env.BASE_URL}WarmUpLogo.png`} alt="" className="navbar-logo-img" />
                WarmUp
            </Link>
            <div className="navbar-sound">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="navbar-volume-slider"
                    title={`Volume: ${volume}%`}
                />
                <button
                    className={`navbar-mute ${silent ? 'navbar-mute-off' : ''}`}
                    onClick={handleMuteToggle}
                    title={muted ? 'Unmute' : 'Mute'}
                >
                    <SoundIcon />
                </button>
            </div>
        </nav>
    )
}
