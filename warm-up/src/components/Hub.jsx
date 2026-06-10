import { useNavigate } from 'react-router-dom'
import './Hub.css'

const GAMES = [
    {
        id: 'quickgrid',
        title: 'QuickGrid',
        description: 'Click the active cells as fast as you can.',
        path: '/quickgrid',
        tags: ['APM', 'Fast', 'Endurance'],
    },
    {
        id: 'colorrush',
        title: 'ColorRush',
        description: 'A color is shown at the top, find and click it in the grid as fast as possible.',
        path: '/colorrush',
        tags: ['Reflex', 'Reaction Time', 'Focus'],
    },
    {
        id: 'keyrush',
        title: 'KeyRush',
        description: 'A sequence of keys appears, type them in order before time runs out.',
        path: '/keyrush',
        tags: ['Typing', 'Sequence', 'QTE'],
    },
    {
        id: 'comingsoon',
        title: 'Coming Soon',
        description: 'More games will be added in the future, stay tuned !',
        path: '/comingsoon',
    },
]

export default function Hub() {
    const navigate = useNavigate()

    return (
        <div className="hub">
            <div className="hub-header">
                <span className="hub-badge">· 3 Games Available ·</span>
                <h1 className="hub-title">Warm Up</h1>
                <p className="hub-subtitle">Train your reflexes and reaction speed before your next ranked game.</p>
            </div>

            <div className="hub-grid">
                {GAMES.map(game => (
                    <div key={game.id} className="game-card" onClick={() => navigate(game.path)}>
                        <div className="game-card-body">
                            <h2 className="game-card-title">{game.title}</h2>
                            <p className="game-card-desc">{game.description}</p>
                        </div>
                        {game.tags && (
                            <div className="game-card-tags">
                                {game.tags.map(tag => (
                                    <span key={tag} className="game-tag">{tag}</span>
                                ))}
                            </div>
                        )}
                        <button className="game-card-btn">Play</button>
                    </div>
                ))}
            </div>
        </div>
    )
}
