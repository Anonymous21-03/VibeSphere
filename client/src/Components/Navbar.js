import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Axios from 'axios';


import './styles/Navbar.css';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  const checkLoginStatus = async () => {
    try {
      const response = await Axios.get('http://localhost:8000/auth/verify-token', { withCredentials: true });
      if (response.data.status) {
        setIsLoggedIn(true);
        // alert("login ho gya bhai ++")
        // console.log(response.data.user);
        // setUser(response.data.user);
      } else {
        setIsLoggedIn(false);
        // alert("login nhi hua bhai --")
        // setUser(null);
      }
    } catch (err) {
      console.error(err);
      setIsLoggedIn(false);
      // setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await Axios.get('http://localhost:8000/auth/logout', {}, { withCredentials: true });
      checkLoginStatus();
      // setIsLoggedIn(false);
      // setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">VibeSphere</Link>
        <ul className="navbar-menu">
          <li className="navbar-item"><Link to="/" className="navbar-link">Home</Link></li>
          <li className="navbar-item"><Link to="/image-analysis" className="navbar-link">Image Analysis</Link></li>
          <li className="navbar-item"><Link to="/video-analysis" className="navbar-link">Video Analysis</Link></li>
          <li className="navbar-item"><Link to="/playlist" className="navbar-link">Playlist</Link></li> {/* Added Playlist link */}
        </ul>
        <div className="auth-links">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="auth-link logout-button">Logout</button>
          ) : (
            <>
              <Link to="/login" className="auth-link">Login</Link>
              <Link to="/signup" className="auth-link">Sign Up</Link>
            </>
          )}
          {/* <Link to="/login" className="auth-link">Login</Link>
          <Link to="/signup" className="auth-link">Sign Up</Link> */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
