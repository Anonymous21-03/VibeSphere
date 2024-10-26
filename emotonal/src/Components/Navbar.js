import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Navbar.css'; // Updated import path

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">VibeSphere</Link>
        <ul className="navbar-menu">
          <li className="navbar-item"><Link to="/" className="navbar-link">Home</Link></li>
          <li className="navbar-item"><Link to="/image-analysis" className="navbar-link">Image Analysis</Link></li>
          <li className="navbar-item"><Link to="/video-analysis" className="navbar-link">Video Analysis</Link></li>
        </ul>
        <div className="auth-links">
          <Link to="/login" className="auth-link">Login</Link>
          <Link to="/signup" className="auth-link">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
