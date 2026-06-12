import { useState, useRef, useEffect } from 'react'
import './RhythmGrid.css'
import { playCorrect, playWrong, playLevelUp, playGameOver, playStart } from '../../sounds'

const CELL = 96
const NOTE = 64
const MARG = CELL
const GRID = 5
const SG   = GRID * CELL + MARG * 2

const COLORS = ['#f0e040', '#00e5ff', '#39ff14', '#ff4444', '#bf5fff', '#ff8c00']
const DIRS   = ['top', 'bottom', 'left', 'right']

const CLASSIC_LEVELS = [
    { travel:  900, window: 420, maxOn: 1, every: 1600 },
    { travel:  760, window: 400, maxOn: 1, every: 1400 },
    { travel:  630, window: 370, maxOn: 2, every: 1220 },
    { travel:  520, window: 340, maxOn: 2, every: 1060 },
    { travel:  430, window: 310, maxOn: 3, every:  920 },
    { travel:  360, window: 280, maxOn: 3, every:  800 },
    { travel:  300, window: 250, maxOn: 4, every:  700 },
    { travel:  250, window: 220, maxOn: 4, every:  620 },
    { travel:  210, window: 190, maxOn: 5, every:  550 },
]

const SURVIVAL_LEVELS = [
    { travel: 1400, maxOn: 3, every:  950 },
    { travel: 1270, maxOn: 4, every:  880 },
    { travel: 1150, maxOn: 4, every:  810 },
    { travel: 1040, maxOn: 5, every:  740 },
    { travel:  940, maxOn: 5, every:  680 },
    { travel:  850, maxOn: 6, every:  620 },
    { travel:  770, maxOn: 6, every:  570 },
    { travel:  700, maxOn: 7, every:  530 },
    { travel:  640, maxOn: 8, every:  490 },
]

function classicCfg(lvl) { return CLASSIC_LEVELS[Math.min(lvl - 1, CLASSIC_LEVELS.length - 1)] }
function survivalCfg(lvl) { return SURVIVAL_LEVELS[Math.min(lvl - 1, SURVIVAL_LEVELS.length - 1)] }

let uid = 0

function makeNote(lvl, existing, surv) {
    const occupied = new Set(existing.map(n => `${n.row},${n.col}`))
    let row, col, tries = 0
    do {
        row = Math.floor(Math.random() * GRID)
        col = Math.floor(Math.random() * GRID)
        tries++
    } while (occupied.has(`${row},${col}`) && tries < 20)

    const dir = DIRS[Math.floor(Math.random() * 4)]
    const c = surv ? survivalCfg(lvl) : classicCfg(lvl)
    return {
        id: ++uid,
        dir, row, col,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        travel: c.travel,
        hitWindow: c.window || 0,
        spawnAt: 0,
        state: 'traveling',
        surv,
    }
}

function startPx(note) {
    const o = (CELL - NOTE) / 2
    switch (note.dir) {
        case 'top':    return { left: MARG + note.col * CELL + o, top: -NOTE }
        case 'bottom': return { left: MARG + note.col * CELL + o, top:  SG   }
        case 'left':   return { left: -NOTE, top: MARG + note.row * CELL + o }
        case 'right':  return { left:  SG,   top: MARG + note.row * CELL + o }
    }
}

function classicEndPx(note) {
    const o = (CELL - NOTE) / 2
    return { left: MARG + note.col * CELL + o, top: MARG + note.row * CELL + o }
}

function survivalEndPx(note) {
    const o = (CELL - NOTE) / 2
    switch (note.dir) {
        case 'top':    return { left: MARG + note.col * CELL + o, top:  SG   }
        case 'bottom': return { left: MARG + note.col * CELL + o, top: -NOTE }
        case 'left':   return { left:  SG,   top: MARG + note.row * CELL + o }
        case 'right':  return { left: -NOTE, top: MARG + note.row * CELL + o }
    }
}

function notePx(note, now) {
    const t = Math.min(1, (now - note.spawnAt) / note.travel)
    const s = startPx(note)
    const e = note.surv ? survivalEndPx(note) : classicEndPx(note)
    return { left: s.left + (e.left - s.left) * t, top: s.top + (e.top - s.top) * t }
}

export default function RhythmGrid() {
    const [, bump]      = useState(0)
    const [phase, setPhase]     = useState('idle')
    const [score, setScore]     = useState(0)
    const [combo, setCombo]     = useState(0)
    const [lives, setLives]     = useState(3)
    const [level, setLevel]     = useState(1)
    const [noGrid, setNoGrid]   = useState(false)
    const [survival, setSurvival] = useState(false)
    const [scores, setScores]   = useState(() => {
        try { return JSON.parse(localStorage.getItem('rhythmgrid_scores') || '[]') } catch { return [] }
    })

    const notesRef   = useRef([])
    const phaseRef   = useRef('idle')
    const scoreRef   = useRef(0)
    const comboRef   = useRef(0)
    const livesRef   = useRef(3)
    const levelRef   = useRef(1)
    const hitsRef    = useRef(0)
    const rafRef     = useRef(null)
    const spawnRef   = useRef(null)
    const tidsRef    = useRef([])
    const survivalRef = useRef(false)

    phaseRef.current  = phase
    survivalRef.current = survival

    const clearAll = () => {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        clearTimeout(spawnRef.current)
        tidsRef.current.forEach(clearTimeout)
        tidsRef.current = []
    }

    const endGame = () => {
        if (phaseRef.current !== 'playing') return
        playGameOver()
        clearAll()
        phaseRef.current = 'gameover'
        setPhase('gameover')
        const entry = { score: scoreRef.current, level: levelRef.current }
        setScores(prev => {
            const u = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, 10)
            localStorage.setItem('rhythmgrid_scores', JSON.stringify(u))
            return u
        })
    }

    const onHit = (id) => {
        playCorrect()
        comboRef.current += 1
        scoreRef.current += 100 * comboRef.current
        hitsRef.current  += 1
        setCombo(comboRef.current)
        setScore(scoreRef.current)
        if (hitsRef.current % 5 === 0) {
            playLevelUp()
            levelRef.current = Math.min(levelRef.current + 1, SURVIVAL_LEVELS.length)
            setLevel(levelRef.current)
        }
        notesRef.current = notesRef.current.filter(n => n.id !== id)
    }

    const onMiss = (id) => {
        if (phaseRef.current !== 'playing') return
        playWrong()
        comboRef.current = 0
        setCombo(0)
        livesRef.current -= 1
        setLives(livesRef.current)
        notesRef.current = notesRef.current.filter(n => n.id !== id)
        if (livesRef.current <= 0) endGame()
    }

    const handleCellClick = (row, col) => {
        if (phaseRef.current !== 'playing') return
        const ready = notesRef.current.find(n => n.state === 'ready' && n.row === row && n.col === col)
        if (ready) onHit(ready.id)
    }

    const trySpawn = () => {
        if (phaseRef.current !== 'playing') return
        const surv = survivalRef.current
        const c = surv ? survivalCfg(levelRef.current) : classicCfg(levelRef.current)
        const active = notesRef.current.filter(n => n.state === 'traveling' || n.state === 'ready').length
        if (active < c.maxOn) {
            const note = makeNote(levelRef.current, notesRef.current, surv)
            note.spawnAt = Date.now()
            notesRef.current = [...notesRef.current, note]

            if (surv) {
                const t1 = setTimeout(() => {
                    if (phaseRef.current !== 'playing') return
                    const n = notesRef.current.find(x => x.id === note.id)
                    if (n) onMiss(note.id)
                }, note.travel)
                tidsRef.current.push(t1)
            } else {
                const t1 = setTimeout(() => {
                    if (phaseRef.current !== 'playing') return
                    const n = notesRef.current.find(x => x.id === note.id)
                    if (n) n.state = 'ready'
                }, note.travel)

                const t2 = setTimeout(() => {
                    if (phaseRef.current !== 'playing') return
                    const n = notesRef.current.find(x => x.id === note.id)
                    if (n?.state === 'ready') onMiss(note.id)
                }, note.travel + note.hitWindow)

                tidsRef.current.push(t1, t2)
            }
        }
        spawnRef.current = setTimeout(trySpawn, c.every)
    }

    const tick = () => {
        if (phaseRef.current !== 'playing') return
        bump(n => n + 1)
        rafRef.current = requestAnimationFrame(tick)
    }

    const startGame = () => {
        clearAll()
        notesRef.current = []
        scoreRef.current = 0
        comboRef.current = 0
        livesRef.current = 3
        levelRef.current = 1
        hitsRef.current  = 0
        setScore(0)
        setCombo(0)
        setLives(3)
        setLevel(1)
        playStart()
        phaseRef.current = 'playing'
        setPhase('playing')
        rafRef.current = requestAnimationFrame(tick)
        trySpawn()
    }

    useEffect(() => () => clearAll(), [])

    useEffect(() => {
        const onKey = (e) => {
            if (e.code === 'Space' && phaseRef.current !== 'playing') { e.preventDefault(); startGame() }
            if (e.code === 'Escape' && phaseRef.current === 'playing') { e.preventDefault(); endGame() }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const now   = Date.now()
    const notes = notesRef.current

    return (
        <div className="rg-wrapper">

            <aside className="rg-sidebar">
                <p className="rg-section-title">Mode</p>
                <button
                    className={`rg-option-btn${!survival ? ' active' : ''}`}
                    onClick={() => setSurvival(false)}
                >
                    <span className="rg-option-label">Classic</span>
                    <span className="rg-option-desc">Click the target cell</span>
                </button>
                <button
                    className={`rg-option-btn${survival ? ' active' : ''}`}
                    onClick={() => setSurvival(true)}
                >
                    <span className="rg-option-label">Survival</span>
                    <span className="rg-option-desc">Click crossing squares</span>
                </button>
                <div className="rg-divider" />
                <p className="rg-section-title">How to Play</p>
                {survival ? (
                    <div className="rg-steps">
                        <div className="rg-step"><span className="rg-step-n">1</span><span className="rg-step-t">Squares cross the grid edge to edge</span></div>
                        <div className="rg-step"><span className="rg-step-n">2</span><span className="rg-step-t">Click them while inside the grid</span></div>
                        <div className="rg-step"><span className="rg-step-n">3</span><span className="rg-step-t">If one exits you lose a life</span></div>
                        <div className="rg-step"><span className="rg-step-n">4</span><span className="rg-step-t">Survive as long as possible</span></div>
                    </div>
                ) : (
                    <div className="rg-steps">
                        <div className="rg-step"><span className="rg-step-n">1</span><span className="rg-step-t">A cell lights up, that's your target</span></div>
                        <div className="rg-step"><span className="rg-step-n">2</span><span className="rg-step-t">A square slides toward it from the edge</span></div>
                        <div className="rg-step"><span className="rg-step-n">3</span><span className="rg-step-t">Click the cell when the square arrives</span></div>
                        <div className="rg-step"><span className="rg-step-n">4</span><span className="rg-step-t">More squares appear each level</span></div>
                    </div>
                )}
                <div className="rg-divider" />
                <p className="rg-section-title">Options</p>
                <button
                    className={`rg-option-btn${noGrid ? ' active' : ''}`}
                    onClick={() => setNoGrid(v => !v)}
                >
                    <span className="rg-option-label">No Grid</span>
                    <span className="rg-option-desc">{noGrid ? 'ON' : 'OFF'} — harder</span>
                </button>
                <div className="rg-divider" />
                <div className="rg-stat">
                    <span className="rg-stat-label">Lives</span>
                    <span className="rg-stat-value">{'♥'.repeat(lives)}{'♡'.repeat(Math.max(0, 3 - lives))}</span>
                </div>
                <div className="rg-stat">
                    <span className="rg-stat-label">Combo</span>
                    <span className="rg-stat-value rg-yellow">{combo > 1 ? `×${combo}` : '—'}</span>
                </div>
            </aside>

            <div className="rg-main">
                <div className="rg-hud">
                    <div className="rg-hud-block">
                        <span className="rg-hud-label">Score</span>
                        <span className="rg-hud-value">{score}</span>
                    </div>
                    <div className="rg-hud-block">
                        <span className="rg-hud-label">Level</span>
                        <span className="rg-hud-value">{level}</span>
                    </div>
                </div>

                <div className="rg-stage" style={{ width: SG, height: SG }}>

                    {/* Notes */}
                    {notes.map(note => {
                        const { left, top } = notePx(note, now)
                        return (
                            <div
                                key={note.id}
                                className={`rg-note${note.state === 'ready' ? ' rg-note-ready' : ''}${note.surv ? ' rg-note-survival' : ''}`}
                                style={{ left, top, width: NOTE, height: NOTE, background: note.color, boxShadow: `0 0 20px ${note.color}bb` }}
                                onClick={note.surv ? () => onHit(note.id) : undefined}
                            />
                        )
                    })}

                    {/* Grid */}
                    <div
                        className={`rg-grid${noGrid ? ' rg-grid-hidden' : ''}`}
                        style={{
                            left: MARG, top: MARG,
                            width: GRID * CELL, height: GRID * CELL,
                            gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`,
                            pointerEvents: survival ? 'none' : 'auto',
                        }}
                    >
                        {Array.from({ length: GRID }, (_, r) =>
                            Array.from({ length: GRID }, (_, c) => {
                                const note = survival ? null : notes.find(n => n.row === r && n.col === c)
                                const cls  = note?.state === 'ready'
                                    ? 'rg-cell rg-cell-ready'
                                    : note
                                    ? 'rg-cell rg-cell-target'
                                    : 'rg-cell'
                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        className={cls}
                                        style={note ? { '--cc': note.color } : {}}
                                        onClick={() => handleCellClick(r, c)}
                                    />
                                )
                            })
                        )}
                    </div>

                    {phase === 'idle' && (
                        <div className="rg-overlay">
                            <button className="rg-btn" onClick={startGame}>Start</button>
                        </div>
                    )}
                    {phase === 'gameover' && (
                        <div className="rg-overlay">
                            <h2 className="rg-over-title">Game Over</h2>
                            <p className="rg-over-label">Score</p>
                            <span className="rg-over-score">{score}</span>
                            <button className="rg-btn" onClick={startGame}>Try Again</button>
                        </div>
                    )}
                </div>
            </div>

            <aside className="rg-scoreboard">
                <p className="rg-section-title">Best Scores</p>
                {scores.length === 0 ? (
                    <p className="rg-empty">No scores yet</p>
                ) : (
                    <>
                        <table className="rg-table">
                            <thead><tr><th>#</th><th>Score</th><th>Lvl</th></tr></thead>
                            <tbody>
                                {scores.map((s, i) => (
                                    <tr key={i} className={i === 0 ? 'rg-top' : ''}>
                                        <td>{i + 1}</td><td>{s.score}</td><td>{s.level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="rg-clear" onClick={() => { localStorage.removeItem('rhythmgrid_scores'); setScores([]) }}>Clear</button>
                    </>
                )}
                <div className="rg-divider" />
                <p className="rg-section-title">Shortcuts</p>
                <div className="rg-shortcuts">
                    <div className="rg-shortcut"><kbd>Space</kbd><span>Start</span></div>
                    <div className="rg-shortcut"><kbd>Esc</kbd><span>Stop</span></div>
                </div>
            </aside>

        </div>
    )
}
