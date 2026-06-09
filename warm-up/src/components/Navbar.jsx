import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                <img src="/WarmUpLogo.png" alt="WarmUp" className="navbar-logo-img" />
                WarmUp
            </Link>
        </nav>
    )
}
