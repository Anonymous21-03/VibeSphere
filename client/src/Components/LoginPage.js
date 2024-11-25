import React from 'react';
import Axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import './styles/AuthPage.css'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  Axios.defaults.withCredentials = true;

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      Axios.post('http://localhost:8000/auth/login', { email, password },
        { withCredentials: true }
      )
        .then(Response => {
          if (Response.data.status) {
            // alert(Response.data.message);
            navigate('/playlist');
          }
          else {
            alert(Response.data.message);
          }
        });
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">Login</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email" className="auth-label">Email:</label>
          <input
            type="email"
            id="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="password" className="auth-label">Password:</label>
          <input
            type="password"
            id="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="auth-button">Login</button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
             {/* <br />
             Forgot Password? <Link to="/forgotPassword">Click here</Link> */}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
