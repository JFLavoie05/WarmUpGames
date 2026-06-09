import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                <img src={`${import.meta.env.BASE_URL}WarmUpLogo.png`} alt="" className="navbar-logo-img" />
                WarmUp
            </Link>
        </nav>
    )
}
