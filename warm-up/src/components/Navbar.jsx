import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
    const location = useLocation()
    const isHome = location.pathname === '/'

    return (
        <nav className="navbar">
            {!isHome && (
                <Link to="/" className="navbar-back">
                    &#8592;
                </Link>
            )}
            <Link to="/" className="navbar-logo">
                <img src={`${import.meta.env.BASE_URL}WarmUpLogo.png`} alt="" className="navbar-logo-img" />
                WarmUp
            </Link>
        </nav>
    )
}
