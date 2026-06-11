import { useState, useRef, useEffect } from 'react'
import './ChimpTest.css'
import { playCorrect, playWrong, playLevelUp, playGameOver, playStart } from '../../sounds'

const CONTAINER_W = 560
const CONTAINER_H = 340
const CELL_SIZE = 60
const GRID_COLS = 7
const GRID_ROWS = 4

function shuffleArray(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function generateCells(level) {
    const slotW = CONTAINER_W / GRID_COLS
    const slotH = CONTAINER_H / GRID_ROWS
    const slots = []
    for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++)
            slots.push({ r, c })

    return shuffleArray(slots).slice(0, level).map((slot, i) => ({
        id: i,
        number: i + 1,
        x: Math.round(slot.c * slotW + (slotW - CELL_SIZE) / 2),
        y: Math.round(slot.r * slotH + (slotH - CELL_SIZE) / 2),
        state: 'idle',
    }))
}

export default function ChimpTest() {
    const [phase, setPhase] = useState('idle')
    const [level, setLevel] = useState(4)
    const [cells, setCells] = useState([])
    const [nextExpected, setNextExpected] = useState(1)
    const [bestLevel, setBestLevel] = useState(() =>
        parseInt(localStorage.getItem('chimptest_best') || '0')
    )
    const [history, setHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem('chimptest_history') || '[]') }
        catch { return [] }
    })

    const phaseRef        = useRef('idle')
    const levelRef        = useRef(4)
    const nextExpectedRef = useRef(1)
    const cellsRef        = useRef([])
    const timerRef        = useRef(null)

    phaseRef.current        = phase
    levelRef.current        = level
    nextExpectedRef.current = nextExpected

    const revealTime = (lvl) => Math.max(800, 3400 - lvl * 100)

    const startRound = (lvl) => {
        clearTimeout(timerRef.current)
        const newCells = generateCells(lvl)
        cellsRef.current = newCells
        setCells(newCells)
        nextExpectedRef.current = 1
        setNextExpected(1)
        phaseRef.current = 'showing'
        setPhase('showing')
        timerRef.current = setTimeout(() => {
            phaseRef.current = 'clicking'
            setPhase('clicking')
        }, revealTime(lvl))
    }

    const startGame = () => {
        playStart()
        setLevel(4)
        levelRef.current = 4
        startRound(4)
    }

    const stopGame = () => {
        clearTimeout(timerRef.current)
        phaseRef.current = 'idle'
        setPhase('idle')
        setLevel(4)
        levelRef.current = 4
        setCells([])
        cellsRef.current = []
        nextExpectedRef.current = 1
        setNextExpected(1)
    }

    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space') {
                e.preventDefault()
                if (phaseRef.current === 'idle' || phaseRef.current === 'gameover') {
                    startGame()
                }
            }
            if (e.code === 'Escape') {
                e.preventDefault()
                if (phaseRef.current !== 'idle') stopGame()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [])

    const handleCellClick = (id) => {
        if (phaseRef.current === 'showing') {
            clearTimeout(timerRef.current)
            phaseRef.current = 'clicking'
            setPhase('clicking')
        }

        if (phaseRef.current !== 'clicking') return

        const cell = cellsRef.current.find(c => c.id === id)
        if (!cell || cell.state !== 'idle') return

        if (cell.number !== nextExpectedRef.current) {
            playWrong()
            phaseRef.current = 'gameover'
            setPhase('gameover')
            const updated = cellsRef.current.map(c => ({
                ...c,
                state: c.id === id ? 'wrong' : 'idle',
            }))
            cellsRef.current = updated
            setCells(updated)
            const failedLevel = levelRef.current
            setHistory(prev => {
                const next = [{ level: failedLevel, ts: Date.now() }, ...prev].slice(0, 10)
                localStorage.setItem('chimptest_history', JSON.stringify(next))
                return next
            })
            return
        }

        const updated = cellsRef.current.map(c =>
            c.id === id ? { ...c, state: 'correct' } : c
        )
        cellsRef.current = updated
        setCells(updated)

        const next = nextExpectedRef.current + 1

        playCorrect()

        if (next > levelRef.current) {
            playLevelUp()
            const completed = levelRef.current
            const newLevel = completed + 1
            levelRef.current = newLevel
            setLevel(newLevel)
            setBestLevel(b => {
                const nb = Math.max(b, completed)
                if (nb > b) localStorage.setItem('chimptest_best', nb)
                return nb
            })
            phaseRef.current = 'success'
            setPhase('success')
            timerRef.current = setTimeout(() => startRound(newLevel), 700)
        } else {
            nextExpectedRef.current = next
            setNextExpected(next)
        }
    }

    const clearBest = () => {
        setBestLevel(0)
        localStorage.removeItem('chimptest_best')
    }

    const clearHistory = () => {
        setHistory([])
        localStorage.removeItem('chimptest_history')
    }

    const showNumber = (cell) =>
        phase === 'showing' || phase === 'success' || phase === 'gameover' || cell.state !== 'idle'

    const getVisualState = (cell) =>
        phase === 'clicking' && cell.state === 'idle' ? 'blank' : cell.state

    const statusText = {
        idle:     'Memorize the numbers, then click them in order.',
        showing:  `Memorize ${level} numbers!`,
        clicking: `Click 1 → ${level} in order`,
        success:  'Level up!',
        gameover: `Game over - failed at level ${level}`,
    }[phase] || ''

    return (
        <div className="chimptest-wrapper">

            <div className="ct-sidebar">
                <p className="ct-sidebar-title">How to play</p>
                <div className="ct-sidebar-steps">
                    <div className="ct-sidebar-step">
                        <span className="ct-sidebar-step-num">1</span>
                        <span className="ct-sidebar-step-text">Numbers appear briefly on the grid</span>
                    </div>
                    <div className="ct-sidebar-step">
                        <span className="ct-sidebar-step-num">2</span>
                        <span className="ct-sidebar-step-text">Remember them</span>
                    </div>
                    <div className="ct-sidebar-step">
                        <span className="ct-sidebar-step-num">3</span>
                        <span className="ct-sidebar-step-text">Click them in order 1 → N</span>
                    </div>
                    <div className="ct-sidebar-step">
                        <span className="ct-sidebar-step-num">4</span>
                        <span className="ct-sidebar-step-text">Each level adds one number</span>
                    </div>
                </div>
                <div className="ct-sidebar-divider" />
                <button
                    className="ct-sidebar-clear"
                    onClick={clearBest}
                    disabled={!bestLevel}
                >
                    Clear best
                </button>
            </div>

            <div className="chimptest">

                <div className="ct-hud">
                    <div className="ct-hud-block">
                        <span className="ct-hud-label">Level</span>
                        <span className="ct-hud-value">
                            {phase === 'idle' ? '—' : level}
                        </span>
                    </div>
                    <div className="ct-hud-block">
                        <span className="ct-hud-label">Next</span>
                        <span className="ct-hud-value ct-hud-accent">
                            {phase === 'clicking' ? nextExpected : '—'}
                        </span>
                    </div>
                    <div className="ct-hud-block">
                        <span className="ct-hud-label">Best</span>
                        <span className="ct-hud-value ct-hud-best">
                            {bestLevel || '—'}
                        </span>
                    </div>
                </div>

                <p className="ct-status">{statusText}</p>

                <div className="ct-area" style={{ width: CONTAINER_W, height: CONTAINER_H }}>
                    {phase === 'idle' && (
                        <div className="ct-area-placeholder">
                            <p>Numbers appear briefly</p>
                            <p>Click them in order</p>
                        </div>
                    )}
                    {cells.map(cell => (
                        <div
                            key={cell.id}
                            className={`ct-cell ct-cell-${getVisualState(cell)}`}
                            style={{ left: cell.x, top: cell.y, width: CELL_SIZE, height: CELL_SIZE }}
                            onClick={() => handleCellClick(cell.id)}
                        >
                            {showNumber(cell) && cell.number}
                        </div>
                    ))}
                </div>

                {(phase === 'idle' || phase === 'gameover') && (
                    <button className="ct-btn" onClick={startGame}>
                        {phase === 'idle' ? 'Start' : 'Try Again'}
                    </button>
                )}

            </div>

            <div className="ct-scoreboard">
                <p className="ct-scoreboard-title">History</p>
                {history.length === 0 ? (
                    <p className="ct-scoreboard-empty">No games yet</p>
                ) : (
                    <>
                        <table className="ct-scoreboard-table">
                            <thead>
                                <tr><th>#</th><th>Level</th></tr>
                            </thead>
                            <tbody>
                                {history.map((h, i) => (
                                    <tr key={h.ts} className={i === 0 ? 'ct-scoreboard-top' : ''}>
                                        <td>{i + 1}</td>
                                        <td>{h.level}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button className="ct-scoreboard-clear" onClick={clearHistory}>
                            Clear
                        </button>
                    </>
                )}
                <div className="ct-sidebar-divider" />
                <p className="ct-scoreboard-title">Shortcuts</p>
                <div className="ct-shortcuts-list">
                    <div className="ct-shortcut-row"><kbd>Space</kbd><span>Start</span></div>
                    <div className="ct-shortcut-row"><kbd>Esc</kbd><span>Stop</span></div>
                </div>
            </div>

        </div>
    )
}
