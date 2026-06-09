import { useNavigate } from 'react-router-dom'
import './Hub.css'

const GAMES = [
    {
        id: 'quickgrid',
        title: 'QuickGrid',
        description: 'Click the active cells as fast as you can. The more you click, the more cells appear !',
        path: '/quickgrid',


    },
    {
        id: 'comingsoon',
        title: 'Coming Soon',
        description: 'More games will be added in the future, stay tuned !',
        path: '/comingsoon',
    }
]

export default function Hub() {
    const navigate = useNavigate()

    return (
        <div className="hub">
            <div className="hub-header">
                <h1 className="hub-title">Warm Up</h1>
                <p className="hub-subtitle">Need to warm up ? Train your reflexes and reaction speed with these games.</p>
            </div>

            <div className="hub-grid">
                {GAMES.map(game => (
                    <div key={game.id} className="game-card" onClick={() => navigate(game.path)}>
                        <div className="game-card-body">
                            <h2 className="game-card-title">{game.title}</h2>
                            <p className="game-card-desc">{game.description}</p>
                        </div>
                        <button className="game-card-btn">Play</button>
                    </div>
                ))}
            </div>
        </div>
    )
}
