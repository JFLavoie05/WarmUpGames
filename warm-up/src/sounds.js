let ctx = null
let muted = localStorage.getItem('warmup_muted') === 'true'
let masterVolume = parseFloat(localStorage.getItem('warmup_volume') ?? '0.7')

function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    return ctx
}

function schedule(c, freq, dur, type, vol) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(vol, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + dur + 0.01)
}

function tone(freq, dur, type = 'sine', vol = 0.22) {
    if (muted || masterVolume === 0) return
    try {
        const c = ac()
        const v = vol * masterVolume
        if (c.state === 'suspended') {
            c.resume().then(() => schedule(c, freq, dur, type, v))
        } else {
            schedule(c, freq, dur, type, v)
        }
    } catch {}
}

export function playCorrect() {
    tone(880, 0.08)
}

export function playWrong() {
    tone(280, 0.10, 'triangle', 0.13)
}

export function playSuccess() {
    tone(660, 0.07)
    setTimeout(() => tone(880, 0.10), 90)
}

export function playLevelUp() {
    tone(660, 0.07)
    setTimeout(() => tone(880, 0.07), 90)
    setTimeout(() => tone(1100, 0.14), 180)
}

export function playGameOver() {
    if (muted || masterVolume === 0) return
    try {
        const c = ac()
        const play = () => {
            const osc = c.createOscillator()
            const gain = c.createGain()
            osc.connect(gain)
            gain.connect(c.destination)
            osc.type = 'sine'
            osc.frequency.setValueAtTime(440, c.currentTime)
            osc.frequency.linearRampToValueAtTime(180, c.currentTime + 0.45)
            gain.gain.setValueAtTime(0.22 * masterVolume, c.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5)
            osc.start(c.currentTime)
            osc.stop(c.currentTime + 0.5)
        }
        if (c.state === 'suspended') {
            c.resume().then(play)
        } else {
            play()
        }
    } catch {}
}

const KEY_CLICK_SRC = new Audio(`${import.meta.env.BASE_URL}keyclicksound2.wav`)

export function playKeyClick() {
    if (muted || masterVolume === 0) return
    const s = KEY_CLICK_SRC.cloneNode()
    s.volume = 0.3 * masterVolume
    s.play().catch(() => {})
}

export function playStart() {
    tone(550, 0.06, 'sine', 0.18)
}

export function toggleMute() {
    muted = !muted
    localStorage.setItem('warmup_muted', muted)
    return muted
}

export function isMuted() {
    return muted
}

export function setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v))
    localStorage.setItem('warmup_volume', masterVolume)
}

export function getVolume() {
    return masterVolume
}
