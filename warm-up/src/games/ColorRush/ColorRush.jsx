import { useState, useEffect, useRef } from 'react'
import './ColorRush.css'
import { playCorrect, playWrong, playGameOver, playStart } from '../../sounds'

const PALETTE = ['#ff2222', '#00aaff', '#ffd700', '#00e64d', '#aa00ff', '#ff3399']
const GRID_SIZES = [3, 4, 5]
const ROUND_OPTIONS = [5, 10, 20]

function generateGrid(gridSize) {
    return Array.from({ length: gridSize * gridSize }, () =>
        PALETTE[Math.floor(Math.random() * PALETTE.length)]
    )
}

function pickTarget(grid, exclude = null) {
    const available = [...new Set(grid)].filter(c => c !== exclude)
    const pool = available.length > 0 ? available : [...new Set(grid)]
    return pool[Math.floor(Math.random() * pool.length)]
}

export default function ColorRush() {

    const [mode, setMode] = useState('reflex')
    const [gridSize, setGridSize] = useState(5)
    const [suddenDeath, setSuddenDeath] = useState(true)
    const [timerDuration, setTimerDuration] = useState(30)
    const [grid, setGrid] = useState([])
    const [targetColor, setTargetColor] = useState(null)
    const [score, setScore] = useState(0)
    const [timeleft, setTimeLeft] = useState(30)
    const [isPlaying, setIsPlaying] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [totalRounds, setTotalRounds] = useState(10)
    const [round, setRound] = useState(0)
    const [reactionTimes, setReactionTimes] = useState([])
    const roundStartRef = useRef(null)
    const prevBestRef = useRef(null)

    const [rushScores, setRushScores] = useState(() => {
        const saved = localStorage.getItem('colorrush_rush_scores')
        return saved ? JSON.parse(saved) : []
    })
    const [reflexScores, setReflexScores] = useState(() => {
        const saved = localStorage.getItem('colorrush_reflex_scores')
        return saved ? JSON.parse(saved) : []
    })

    const saveReflexScore = (times) => {
        if (times.length === 0) return
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        const entry = { avg, rounds: times.length, config: { gridSize, totalRounds } }
        const updated = [...reflexScores, entry]
            .sort((a, b) => a.avg - b.avg)
            .slice(0, 10)
        localStorage.setItem('colorrush_reflex_scores', JSON.stringify(updated))
        setReflexScores(updated)
    }

    const endGame = (reflexTimesOverride = null) => {
        playGameOver()
        setIsPlaying(false)
        setGrid([])
        setTargetColor(null)
        setGameOver(true)
        if (mode === 'rush') {
            setScore(current => {
                const entry = { score: current, config: { gridSize, timerDuration } }
                const updated = [...rushScores, entry]
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                localStorage.setItem('colorrush_rush_scores', JSON.stringify(updated))
                setRushScores(updated)
                return current
            })
        } else {
            saveReflexScore(reflexTimesOverride ?? reactionTimes)
        }
    }

    const stopGame = () => {
        setIsPlaying(false)
        setGrid([])
        setTargetColor(null)
        setScore(0)
        setTimeLeft(timerDuration)
        setGameOver(false)
        setRound(0)
        setReactionTimes([])
    }

    const startGame = () => {
        playStart()
        prevBestRef.current = reflexScores[0]?.avg ?? null
        const newGrid = generateGrid(gridSize)
        setScore(0)
        setTimeLeft(timerDuration)
        setGrid(newGrid)
        setTargetColor(pickTarget(newGrid))
        setIsPlaying(true)
        setGameOver(false)
        setRound(1)
        setReactionTimes([])
        roundStartRef.current = Date.now()
    }

    useEffect(() => {
        if (!isPlaying) setTimeLeft(timerDuration)
    }, [timerDuration])

    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space') { e.preventDefault(); startGame() }
            if (e.code === 'Escape') { e.preventDefault(); stopGame() }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [gridSize, timerDuration, mode])

    useEffect(() => {
        if (!isPlaying) return
        if (mode === 'reflex') return
        if (timerDuration === 0) return
        if (timeleft === 0) { endGame(); return }
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
        return () => clearTimeout(timer)
    }, [timeleft, isPlaying])

    const handleCellClick = (color) => {
        if (!isPlaying) return
        if (color === targetColor) {
            playCorrect()
            if (mode === 'reflex') {
                const elapsed = Date.now() - roundStartRef.current
                const nextTimes = [...reactionTimes, elapsed]
                if (nextTimes.length >= totalRounds) {
                    setReactionTimes(nextTimes)
                    endGame(nextTimes)
                    return
                }
                setReactionTimes(nextTimes)
                setRound(r => r + 1)
                const newGrid = generateGrid(gridSize)
                setGrid(newGrid)
                setTargetColor(pickTarget(newGrid, targetColor))
                roundStartRef.current = Date.now()
            } else {
                setScore(s => s + 1)
                const newGrid = generateGrid(gridSize)
                setGrid(newGrid)
                setTargetColor(pickTarget(newGrid, targetColor))
            }
        } else {
            playWrong()
            if (mode === 'reflex') {
                endGame()
            } else {
                if (suddenDeath) { endGame(); return }
                if (score > 0) setScore(s => s - 1)
            }
        }
    }

    const avgTime = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : null

    const gameOverTitle = mode === 'reflex'
        ? (reactionTimes.length >= totalRounds ? 'Complete' : 'Game Over')
        : (timeleft === 0 && timerDuration !== 0 ? "Time's up" : 'Game Over')

    return (
        <div className="colorrush-wrapper">

            <Sidebar
                mode={mode} setMode={setMode}
                gridSize={gridSize} setGridSize={setGridSize}
                suddenDeath={suddenDeath} setSuddenDeath={setSuddenDeath}
                timerDuration={timerDuration} setTimerDuration={setTimerDuration}
                totalRounds={totalRounds} setTotalRounds={setTotalRounds}
                isPlaying={isPlaying}
            />

            <div className="colorrush">
                {gameOver ? (
                    <div className="game-over">
                        <h2 className="game-over-title">{gameOverTitle}</h2>
                        {mode === 'reflex' ? (
                            <>
                                <p className="game-over-label">Avg Reaction Time</p>
                                {avgTime !== null
                                    ? <div className="game-over-reflex">
                                        <span className="game-over-score">{avgTime}</span>
                                        <span className="game-over-unit">ms</span>
                                      </div>
                                    : <span className="game-over-score">—</span>
                                }
                                {avgTime !== null && (() => {
                                    const prev = prevBestRef.current
                                    if (prev === null) return <span className="game-over-delta game-over-delta-new">First score!</span>
                                    const delta = avgTime - prev
                                    if (delta < 0) return <span className="game-over-delta game-over-delta-better">↓ {Math.abs(delta)}ms faster than your best</span>
                                    if (delta > 0) return <span className="game-over-delta game-over-delta-worse">↑ {delta}ms slower than your best</span>
                                    return <span className="game-over-delta game-over-delta-new">Matched your best!</span>
                                })()}
                                <span className="game-over-rounds">{reactionTimes.length} / {totalRounds} rounds</span>
                            </>
                        ) : (
                            <>
                                <p className="game-over-label">Final Score</p>
                                <span className="game-over-score">{score}</span>
                            </>
                        )}
                        <button className="colorrush-btn" onClick={startGame}>Restart</button>
                    </div>
                ) : (
                    <>
                        <div className="colorrush-hud">
                            {mode === 'rush' ? (
                                <>
                                    <div className="hud-block">
                                        <span className="hud-label">Score</span>
                                        <span className="hud-value">{score}</span>
                                    </div>
                                    <div className="hud-block">
                                        <span className="hud-label">Hit this color</span>
                                        {targetColor
                                            ? <div className="color-target" style={{ background: targetColor, boxShadow: `0 0 24px ${targetColor}99` }} />
                                            : <div className="color-target color-target-empty" />
                                        }
                                    </div>
                                    <div className="hud-block">
                                        <span className="hud-label">Time</span>
                                        <span className={`hud-value ${timeleft <= 5 && timerDuration !== 0 ? 'hud-danger' : ''}`}>
                                            {timerDuration === 0 ? '∞' : `${timeleft}s`}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="hud-block">
                                        <span className="hud-label">Round</span>
                                        <span className="hud-value">{isPlaying ? `${round}/${totalRounds}` : '—'}</span>
                                    </div>
                                    <div className="hud-block">
                                        <span className="hud-label">Hit this color</span>
                                        {targetColor
                                            ? <div className="color-target" style={{ background: targetColor, boxShadow: `0 0 24px ${targetColor}99` }} />
                                            : <div className="color-target color-target-empty" />
                                        }
                                    </div>
                                    <div className="hud-block">
                                        <span className="hud-label">Avg</span>
                                        <span className="hud-value hud-small">{avgTime !== null ? `${avgTime}ms` : '—'}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div
                            className="colorrush-grid"
                            style={{ gridTemplateColumns: `repeat(${gridSize}, 80px)` }}
                        >
                            {(grid.length > 0 ? grid : Array(gridSize * gridSize).fill(null)).map((color, i) => (
                                <div
                                    key={i}
                                    className={`cr-cell ${!color ? 'cr-cell-placeholder' : ''}`}
                                    style={color ? { background: color } : {}}
                                    onPointerDown={color ? (e) => { if (e.button === 2) return; handleCellClick(color) } : undefined}
                                    onContextMenu={(e) => e.preventDefault()}
                                />
                            ))}
                        </div>

                        <div className="colorrush-actions">
                            <button className="colorrush-btn" onClick={startGame}>
                                {isPlaying ? 'Restart' : 'Start'}
                            </button>
                            {isPlaying && (
                                <button className="colorrush-btn-stop" onClick={stopGame}>Stop</button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <ScoreBoard
                mode={mode}
                rushScores={rushScores} setRushScores={setRushScores}
                reflexScores={reflexScores} setReflexScores={setReflexScores}
            />

        </div>
    )
}

function ScoreBoard({ mode, rushScores, setRushScores, reflexScores, setReflexScores }) {
    const clearScores = () => {
        if (mode === 'rush') {
            localStorage.removeItem('colorrush_rush_scores')
            setRushScores([])
        } else {
            localStorage.removeItem('colorrush_reflex_scores')
            setReflexScores([])
        }
    }

    const scores = mode === 'rush' ? rushScores : reflexScores

    return (
        <aside className="scoreboard">
            <span className="sidebar-title">Best Scores</span>
            {scores.length === 0 ? (
                <p className="scoreboard-empty">No scores yet</p>
            ) : mode === 'rush' ? (
                <table className="scoreboard-table">
                    <thead>
                        <tr><th>#</th><th>Score</th><th>Config</th></tr>
                    </thead>
                    <tbody>
                        {scores.map((entry, i) => (
                            <tr key={i} className={i === 0 ? 'scoreboard-top' : ''}>
                                <td>{i + 1}</td>
                                <td>{entry.score}</td>
                                <td>{entry.config.gridSize}x{entry.config.gridSize} · {entry.config.timerDuration === 0 ? '∞' : `${entry.config.timerDuration}s`}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <table className="scoreboard-table">
                    <thead>
                        <tr><th>#</th><th>Avg</th><th>Rounds</th></tr>
                    </thead>
                    <tbody>
                        {scores.map((entry, i) => (
                            <tr key={i} className={i === 0 ? 'scoreboard-top' : ''}>
                                <td>{i + 1}</td>
                                <td>{entry.avg}ms</td>
                                <td>{entry.rounds}/{entry.config.totalRounds}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {scores.length > 0 && (
                <button className="scoreboard-clear" onClick={clearScores}>Clear</button>
            )}

            <div className="sidebar-divider" />

            <span className="sidebar-title">Shortcuts</span>
            <div className="shortcuts-list">
                <div className="shortcut-row"><kbd>Space</kbd><span>Start / Restart</span></div>
                <div className="shortcut-row"><kbd>Esc</kbd><span>Stop</span></div>
            </div>
        </aside>
    )
}

function Sidebar({ mode, setMode, gridSize, setGridSize, suddenDeath, setSuddenDeath, timerDuration, setTimerDuration, totalRounds, setTotalRounds, isPlaying }) {
    return (
        <aside className="sidebar">

            <span className="sidebar-title">Mode</span>
            <div className="sidebar-grid-sizes">
                {['rush', 'reflex'].map(m => (
                    <button
                        key={m}
                        className={`size-btn ${mode === m ? 'active' : ''}`}
                        onClick={() => !isPlaying && setMode(m)}
                        disabled={isPlaying}
                    >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                ))}
            </div>

            <div className="sidebar-divider" />

            <span className="sidebar-title">Grid Size</span>
            <div className="sidebar-grid-sizes">
                {GRID_SIZES.map(size => (
                    <button
                        key={size}
                        className={`size-btn ${gridSize === size ? 'active' : ''}`}
                        onClick={() => !isPlaying && setGridSize(size)}
                        disabled={isPlaying}
                    >
                        {size}x{size}
                    </button>
                ))}
            </div>

            {mode === 'rush' && (
                <>
                    <div className="sidebar-divider" />
                    <span className="sidebar-title">Timer</span>
                    <div className="sidebar-grid-sizes">
                        {[15, 30, 60, 0].map(t => (
                            <button
                                key={t}
                                className={`size-btn ${timerDuration === t ? 'active' : ''}`}
                                onClick={() => !isPlaying && setTimerDuration(t)}
                                disabled={isPlaying}
                            >
                                {t === 0 ? '∞' : `${t}s`}
                            </button>
                        ))}
                    </div>

                    <div className="sidebar-divider" />
                    <span className="sidebar-title">Options</span>
                    <button
                        className={`sidebar-btn ${suddenDeath ? 'active danger' : ''}`}
                        onClick={() => !isPlaying && setSuddenDeath(v => !v)}
                        disabled={isPlaying}
                    >
                        <span className="sidebar-btn-label">Sudden Death</span>
                        <span className="sidebar-btn-desc">{suddenDeath ? 'ON' : 'OFF'}</span>
                    </button>
                </>
            )}

            {mode === 'reflex' && (
                <>
                    <div className="sidebar-divider" />
                    <span className="sidebar-title">Rounds</span>
                    <div className="sidebar-grid-sizes">
                        {ROUND_OPTIONS.map(r => (
                            <button
                                key={r}
                                className={`size-btn ${totalRounds === r ? 'active' : ''}`}
                                onClick={() => !isPlaying && setTotalRounds(r)}
                                disabled={isPlaying}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <div className="sidebar-divider" />
                </>
            )}

        </aside>
    )
}
