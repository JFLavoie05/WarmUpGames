import { useState, useEffect, useRef } from 'react'
import './KeyRush.css'
import { playKeyClick, playWrong, playSuccess, playGameOver, playStart } from '../../sounds'

const KEY_SETS = {
    qwer:  { label: 'QWER',    keys: ['Q', 'W', 'E', 'R'] },
    wasd:  { label: 'WASD',    keys: ['W', 'A', 'S', 'D'] },
    full:  { label: 'Full KB', keys: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
}

const DIFFICULTY = {
    easy:   { label: 'Easy',   timePerKey: 1200, timePerSeq: 4000 },
    medium: { label: 'Medium', timePerKey: 850,  timePerSeq: 2800 },
    hard:   { label: 'Hard',   timePerKey: 700,  timePerSeq: 2000 },
    "?":   { label: '?',   timePerKey: 5000,  timePerSeq: 11000 },
}

const TIMER_MODES = {
    key: { label: 'Per Key', desc: 'Timer resets each key' },
    seq: { label: 'Per Seq', desc: 'Timer for full sequence' },
}

const SEQ_LENGTHS = [3, 4, 6]

function generateSequence(keys, length) {
    return Array.from({ length }, () => keys[Math.floor(Math.random() * keys.length)])
}

export default function KeyRush() {
    const [keySet, setKeySet]         = useState('qwer')
    const [seqLength, setSeqLength]   = useState(4)
    const [difficulty, setDifficulty] = useState('medium')
    const [timerMode, setTimerMode]   = useState('key')
    const [sequence, setSequence]   = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore]         = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [gameOver, setGameOver]   = useState(false)
    const [timerKey, setTimerKey]   = useState(0)
    const [timerMs, setTimerMs]     = useState(DIFFICULTY.medium.timePerKey)
    const [scores, setScores]       = useState(() => {
        const saved = localStorage.getItem('keyrush_scores')
        return saved ? JSON.parse(saved) : []
    })

    const isPlayingRef    = useRef(false)
    const difficultyRef   = useRef(difficulty)
    const keySetRef       = useRef(keySet)
    const seqLengthRef    = useRef(seqLength)
    const timerModeRef    = useRef(timerMode)
    const sequenceRef     = useRef([])
    const currentIndexRef = useRef(0)
    const scoreRef        = useRef(0)
    const timeoutRef      = useRef(null)

    difficultyRef.current = difficulty
    keySetRef.current     = keySet
    seqLengthRef.current  = seqLength
    timerModeRef.current  = timerMode

    const endGame = () => {
        if (!isPlayingRef.current) return
        playGameOver()
        isPlayingRef.current = false
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
        setIsPlaying(false)
        setGameOver(true)
        const entry = {
            score: scoreRef.current,
            config: {
                keySet: keySetRef.current,
                seqLength: seqLengthRef.current,
                difficulty: difficultyRef.current,
                timerMode: timerModeRef.current,
            },
        }
        setScores(prev => {
            const updated = [...prev, entry].sort((a, b) => b.score - a.score).slice(0, 10)
            localStorage.setItem('keyrush_scores', JSON.stringify(updated))
            return updated
        })
    }

    const getTimeMs = () => {
        const diff = DIFFICULTY[difficultyRef.current]
        return timerModeRef.current === 'key' ? diff.timePerKey : diff.timePerSeq
    }

    const resetTimer = () => {
        clearTimeout(timeoutRef.current)
        const ms = getTimeMs()
        setTimerMs(ms)
        setTimerKey(k => k + 1)
        timeoutRef.current = setTimeout(endGame, ms)
    }

    const startGame = () => {
        playStart()
        clearTimeout(timeoutRef.current)
        isPlayingRef.current = true
        const keys = KEY_SETS[keySetRef.current].keys
        const seq  = generateSequence(keys, seqLengthRef.current)
        sequenceRef.current     = seq
        currentIndexRef.current = 0
        setSequence(seq)
        setCurrentIndex(0)
        scoreRef.current = 0
        setScore(0)
        setIsPlaying(true)
        setGameOver(false)
        const ms = getTimeMs()
        setTimerMs(ms)
        setTimerKey(k => k + 1)
        timeoutRef.current = setTimeout(endGame, ms)
    }

    const stopGame = () => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current      = null
        isPlayingRef.current    = false
        sequenceRef.current     = []
        currentIndexRef.current = 0
        setIsPlaying(false)
        setGameOver(false)
        setSequence([])
        setCurrentIndex(0)
        scoreRef.current = 0
        setScore(0)
    }

    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space' && !isPlayingRef.current) {
                e.preventDefault()
                startGame()
                return
            }
            if (e.code === 'Escape') {
                e.preventDefault()
                if (isPlayingRef.current) stopGame()
                return
            }
            if (!isPlayingRef.current) return

            const pressed  = e.key.toUpperCase()
            const expected = sequenceRef.current[currentIndexRef.current]
            if (!expected) return

            if (pressed !== expected) {
                playWrong()
                endGame()
                return
            }

            playKeyClick()
            const nextIndex = currentIndexRef.current + 1
            if (nextIndex >= sequenceRef.current.length) {
                playSuccess()
                scoreRef.current += 1
                setScore(s => s + 1)
                const newSeq = generateSequence(
                    KEY_SETS[keySetRef.current].keys,
                    seqLengthRef.current
                )
                sequenceRef.current     = newSeq
                currentIndexRef.current = 0
                setSequence(newSeq)
                setCurrentIndex(0)
                resetTimer()
            } else {
                currentIndexRef.current = nextIndex
                setCurrentIndex(nextIndex)
                if (timerModeRef.current === 'key') resetTimer()
            }
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [])

    const seqWidth = seqLength * 72 + (seqLength - 1) * 16

    return (
        <div className="keyrush-wrapper">

            <Sidebar
                keySet={keySet}         setKeySet={setKeySet}
                seqLength={seqLength}   setSeqLength={setSeqLength}
                difficulty={difficulty} setDifficulty={setDifficulty}
                timerMode={timerMode}   setTimerMode={setTimerMode}
                isPlaying={isPlaying}
            />

            <div className="keyrush">
                {gameOver ? (
                    <div className="kr-game-over">
                        <h2 className="kr-game-over-title">Game Over</h2>
                        <p className="kr-game-over-label">Sequences</p>
                        <span className="kr-game-over-score">{score}</span>
                        <button className="keyrush-btn" onClick={startGame}>Restart</button>
                    </div>
                ) : (
                    <>
                        <div className="kr-hud">
                            <div className="kr-hud-block">
                                <span className="kr-hud-label">Score</span>
                                <span className="kr-hud-value">{score}</span>
                            </div>
                        </div>

                        <div className="kr-sequence">
                            {sequence.length > 0
                                ? sequence.map((key, i) => (
                                    <div key={i} className={`kr-key ${i === currentIndex ? 'active' : i < currentIndex ? 'done' : ''}`}>
                                        {key}
                                    </div>
                                ))
                                : Array.from({ length: seqLength }, (_, i) => (
                                    <div key={i} className="kr-key kr-key-placeholder" />
                                ))
                            }
                        </div>

                        <div className="kr-timer-bar" style={{ width: `${seqWidth}px` }}>
                            {isPlaying && (
                                <div
                                    key={timerKey}
                                    className="kr-timer-fill"
                                    style={{ animationDuration: `${timerMs}ms` }}
                                />
                            )}
                        </div>

                        <div className="keyrush-actions">
                            <button className="keyrush-btn" onClick={startGame}>
                                {isPlaying ? 'Restart' : 'Start'}
                            </button>
                            {isPlaying && (
                                <button className="keyrush-btn-stop" onClick={stopGame}>Stop</button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <ScoreBoard scores={scores} setScores={setScores} />

        </div>
    )
}

function Sidebar({ keySet, setKeySet, seqLength, setSeqLength, difficulty, setDifficulty, timerMode, setTimerMode, isPlaying }) {
    return (
        <aside className="kr-sidebar">

            <span className="kr-sidebar-title">Key Set</span>
            {Object.entries(KEY_SETS).map(([key, val]) => (
                <button
                    key={key}
                    className={`kr-sidebar-btn ${keySet === key ? 'active' : ''}`}
                    onClick={() => !isPlaying && setKeySet(key)}
                    disabled={isPlaying}
                >
                    <span className="kr-sidebar-btn-label">{val.label}</span>
                    <span className="kr-sidebar-btn-desc">{val.keys.length} keys</span>
                </button>
            ))}

            <div className="kr-sidebar-divider" />

            <span className="kr-sidebar-title">Seq Length</span>
            <div className="kr-sidebar-sizes">
                {SEQ_LENGTHS.map(len => (
                    <button
                        key={len}
                        className={`kr-size-btn ${seqLength === len ? 'active' : ''}`}
                        onClick={() => !isPlaying && setSeqLength(len)}
                        disabled={isPlaying}
                    >
                        {len}
                    </button>
                ))}
            </div>

            <div className="kr-sidebar-divider" />

            <span className="kr-sidebar-title">Timer</span>
            <div className="kr-sidebar-sizes">
                {Object.entries(TIMER_MODES).map(([key, val]) => (
                    <button
                        key={key}
                        className={`kr-size-btn ${timerMode === key ? 'active' : ''}`}
                        style={{ fontSize: '11px' }}
                        onClick={() => !isPlaying && setTimerMode(key)}
                        disabled={isPlaying}
                    >
                        {val.label}
                    </button>
                ))}
            </div>

            <div className="kr-sidebar-divider" />

            <span className="kr-sidebar-title">Difficulty</span>
            {Object.entries(DIFFICULTY).map(([key, val]) => (
                <button
                    key={key}
                    className={`kr-sidebar-btn ${difficulty === key ? 'active' : ''}`}
                    onClick={() => !isPlaying && setDifficulty(key)}
                    disabled={isPlaying}
                >
                    <span className="kr-sidebar-btn-label">{val.label}</span>
                    <span className="kr-sidebar-btn-desc">
                        {timerMode === 'key' ? `${val.timePerKey}ms / key` : `${val.timePerSeq}ms / seq`}
                    </span>
                </button>
            ))}

        </aside>
    )
}

function ScoreBoard({ scores, setScores }) {
    const clearScores = () => {
        localStorage.removeItem('keyrush_scores')
        setScores([])
    }

    return (
        <aside className="kr-scoreboard">
            <span className="kr-sidebar-title">Best Scores</span>
            {scores.length === 0 ? (
                <p className="kr-scoreboard-empty">No scores yet</p>
            ) : (
                <table className="kr-scoreboard-table">
                    <thead>
                        <tr><th>#</th><th>Score</th><th>Config</th></tr>
                    </thead>
                    <tbody>
                        {scores.map((entry, i) => (
                            <tr key={i} className={i === 0 ? 'kr-scoreboard-top' : ''}>
                                <td>{i + 1}</td>
                                <td>{entry.score}</td>
                                <td>{KEY_SETS[entry.config.keySet].label} · {entry.config.seqLength} · {entry.config.difficulty} · {entry.config.timerMode ?? 'key'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {scores.length > 0 && (
                <button className="kr-scoreboard-clear" onClick={clearScores}>Clear</button>
            )}
            <div className="kr-sidebar-divider" />
            <span className="kr-sidebar-title">Shortcuts</span>
            <div className="kr-shortcuts-list">
                <div className="kr-shortcut-row"><kbd>Space</kbd><span>Start / Restart</span></div>
                <div className="kr-shortcut-row"><kbd>Esc</kbd><span>Stop</span></div>
            </div>
        </aside>
    )
}
