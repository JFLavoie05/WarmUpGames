import { useState, useEffect } from 'react'
import './QuickGrid.css'

const GRID_SIZES = [3, 4, 5]

const PRESETS = [
    { id: 'frenzy', label: 'Frenzy', targets: 3, gridSize: 4, timer: 15, color: '#f0e040', pattern: false },
]

function getRandomCells(count, gridSize, exclude = []) {
    const cells = []
    while (cells.length < count) {
        const row = Math.floor(Math.random() * gridSize)
        const col = Math.floor(Math.random() * gridSize)
        const duplicate = [...exclude, ...cells].some(c => c.row === row && c.col === col)
        if (!duplicate) cells.push({ row, col })
    }
    return cells
}

export default function QuickGrid() {

    const [targetCount, setTargetCount] = useState(3)
    const [gridSize, setGridSize] = useState(4)
    const [suddenDeath, setSuddenDeath] = useState(false)
    const [pattern, setPattern] = useState(false)
    const [timerDuration, setTimerDuration] = useState(30)
    const [cellColor, setCellColor] = useState('#f0e040')
    const [activeCells, setActiveCells] = useState([])
    const [score, setScore] = useState(0)
    const [timeleft, setTimeLeft] = useState(30)
    const [isPlaying, setIsPlaying] = useState(false)
    const [gameOver, setGameOver] = useState(false)
    const [scores, setScores] = useState(() => {
        const saved = localStorage.getItem('quickgrid_scores')
        return saved ? JSON.parse(saved) : []
    })

    const endGame = () => {
        setIsPlaying(false)
        setActiveCells([])
        setGameOver(true)
        setScore(current => {
            const entry = {
                score: current,
                config: { gridSize, targetCount, timerDuration },
            }
            const updated = [...scores, entry]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
            localStorage.setItem('quickgrid_scores', JSON.stringify(updated))
            setScores(updated)
            return current
        })
    }

    const stopGame = () => {
        setIsPlaying(false)
        setActiveCells([])
        setScore(0)
        setTimeLeft(timerDuration)
        setGameOver(false)
    }

    const startGame = () => {
        setScore(0)
        setTimeLeft(timerDuration)
        setIsPlaying(true)
        setGameOver(false)
        setActiveCells(getRandomCells(targetCount, gridSize))
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
    }, [targetCount, gridSize])

    useEffect(() => {
        if (!isPlaying) return
        if (timerDuration === 0) return
        if (timeleft === 0) { endGame(); return }
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
        return () => clearTimeout(timer)
    }, [timeleft, isPlaying])

    const handleCellClick = (rowIndex, cellIndex, isActive) => {
        if (!isPlaying) return
        if (isActive) {
            setScore(s => s + 1)
            const remaining = activeCells.filter(c => !(c.row === rowIndex && c.col === cellIndex))
            if (pattern) {
                if (remaining.length > 0) {
                    setActiveCells(remaining)
                } else {
                    setActiveCells(getRandomCells(targetCount, gridSize))
                }
            } else {
                const newCell = getRandomCells(1, gridSize, activeCells)
                setActiveCells([...remaining, ...newCell])
            }
        } else {
            if (suddenDeath) { endGame(); return }
            if (score > 0) setScore(s => s - 1)
        }
    }

    const gameOverTitle = (timeleft === 0 && timerDuration !== 0) ? "Time's up" : 'Game Over'

    return (
        <div className="quickgrid-wrapper">

            <Sidebar
                targetCount={targetCount} setTargetCount={setTargetCount}
                gridSize={gridSize} setGridSize={setGridSize}
                suddenDeath={suddenDeath} setSuddenDeath={setSuddenDeath}
                pattern={pattern} setPattern={setPattern}
                timerDuration={timerDuration} setTimerDuration={setTimerDuration}
                cellColor={cellColor} setCellColor={setCellColor}
                isPlaying={isPlaying}
            />


            <div className="quickgrid">

                {gameOver ? (
                    <div className="game-over">
                        <h2 className="game-over-title">{gameOverTitle}</h2>
                        <p className="game-over-label">Final Score</p>
                        <span className="game-over-score">{score}</span>
                        <button className="quickgrid-btn" onClick={startGame}>Restart</button>
                    </div>
                ) : (
                    <>
                        <div className="quickgrid-hud">
                            <div className="hud-block">
                                <span className="hud-label">Score</span>
                                <span className="hud-value">{score}</span>
                            </div>
                            <div className="hud-block">
                                <span className="hud-label">Time</span>
                                <span className={`hud-value ${timeleft <= 5 && timerDuration !== 0 ? 'hud-danger' : ''}`}>{timerDuration === 0 ? '∞' : `${timeleft}s`}</span>
                            </div>
                        </div>

                        <div className="quickgrid-grid">
                            {Array.from({ length: gridSize }, (_, rowIndex) => (
                                <div key={rowIndex} className="quickgrid-row">
                                    {Array.from({ length: gridSize }, (_, cellIndex) => {
                                        const isActive = activeCells.some(c => c.row === rowIndex && c.col === cellIndex)
                                        return (
                                            <div
                                                key={cellIndex}
                                                className={`cell ${isActive ? 'active' : ''}`}
                                                style={isActive ? { background: cellColor, boxShadow: `0 0 20px ${cellColor}88` } : {}}
                                                onPointerDown={(e) => { if (e.button === 2) return; handleCellClick(rowIndex, cellIndex, isActive) }}
                                                onContextMenu={(e) => { e.preventDefault(); handleCellClick(rowIndex, cellIndex, isActive) }}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="quickgrid-actions">
                            <button className="quickgrid-btn" onClick={startGame}>
                                {isPlaying ? 'Restart' : 'Start'}
                            </button>
                            {isPlaying && (
                                <button className="quickgrid-btn-stop" onClick={timerDuration === 0 ? endGame : stopGame}>Stop</button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <ScoreBoard scores={scores} setScores={setScores} />

        </div>
    )
}

function ScoreBoard({ scores, setScores }) {
    const clearScores = () => {
        localStorage.removeItem('quickgrid_scores')
        setScores([])
    }

    return (
        <aside className="scoreboard">
            <span className="sidebar-title">Best Scores</span>
            {scores.length === 0 ? (
                <p className="scoreboard-empty">No scores yet</p>
            ) : (
                <table className="scoreboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Score</th>
                            <th>Config</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scores.map((entry, i) => (
                            <tr key={i} className={i === 0 ? 'scoreboard-top' : ''}>
                                <td>{i + 1}</td>
                                <td>{entry.score}</td>
                                <td>{entry.config.gridSize}x{entry.config.gridSize} · {entry.config.targetCount}t · {entry.config.timerDuration === 0 ? '∞' : `${entry.config.timerDuration}s`}</td>
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

const COLORS = ['#f0e040', '#00e5ff', '#39ff14', '#ff4444', '#bf5fff', '#ff8c00']

function Sidebar({ targetCount, setTargetCount, gridSize, setGridSize, suddenDeath, setSuddenDeath, pattern, setPattern, timerDuration, setTimerDuration, cellColor, setCellColor, isPlaying }) {
    const maxTargets = gridSize * gridSize - 1

    const applyPreset = (preset) => {
        if (isPlaying) return
        setTargetCount(preset.targets)
        setGridSize(preset.gridSize)
        setTimerDuration(preset.timer)
        setCellColor(preset.color)
    }

    return (
        <aside className="sidebar">

            <span className="sidebar-title">Presets</span>
            {PRESETS.map(p => (
                <button
                    key={p.id}
                    className="sidebar-btn preset-btn"
                    onClick={() => applyPreset(p)}
                    disabled={isPlaying}
                >
                    <span className="sidebar-btn-label">{p.label}</span>
                    <span className="sidebar-btn-desc">{p.targets} targets · {p.gridSize}x{p.gridSize} · {p.timer}s</span>
                </button>
            ))}

            <div className="sidebar-divider" />

            <span className="sidebar-title">Targets</span>
            <div className="sidebar-grid-sizes">
                {[1, 2, 3, 4, 5].filter(n => n <= maxTargets).map(n => (
                    <button
                        key={n}
                        className={`size-btn ${targetCount === n ? 'active' : ''}`}
                        onClick={() => !isPlaying && setTargetCount(n)}
                        disabled={isPlaying}
                    >
                        {n}
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

            <span className="sidebar-title">Color</span>
            <div className="sidebar-colors">
                {COLORS.map(c => (
                    <button
                        key={c}
                        className={`color-swatch ${cellColor === c ? 'active' : ''}`}
                        style={{ background: c }}
                        onClick={() => setCellColor(c)}
                    />
                ))}
            </div>

            <div className="sidebar-divider" />

            <span className="sidebar-title">Options</span>
            <button
                className={`sidebar-btn ${pattern ? 'active' : ''}`}
                onClick={() => !isPlaying && setPattern(v => !v)}
                disabled={isPlaying}
            >
                <span className="sidebar-btn-label">Pattern</span>
                <span className="sidebar-btn-desc">{pattern ? 'ON' : 'OFF'}</span>
            </button>
            <button
                className={`sidebar-btn ${suddenDeath ? 'active danger' : ''}`}
                onClick={() => !isPlaying && setSuddenDeath(v => !v)}
                disabled={isPlaying}
            >
                <span className="sidebar-btn-label">Sudden Death</span>
                <span className="sidebar-btn-desc">{suddenDeath ? 'ON' : 'OFF'}</span>
            </button>

        </aside>
    )
}
