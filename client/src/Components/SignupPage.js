import React from 'react';
import Axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles/AuthPage.css'; 

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await Axios.post('http://localhost:8000/auth/signup', { username, email, password });
      if (response.data.status) {
        alert(response.data.message);
        navigate('/login');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message);
      } else {
        console.error('Registration failed', error);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">Sign Up</h2>

        <form className="auth-form" onSubmit={handleSubmit}>

          <label htmlFor="username" className="auth-label">Username:</label>
          <input
            type="text"
            id="username"
            className="auth-input"
            // value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="email" className="auth-label">Email:</label>
          <input
            type="email"
            id="email"
            className="auth-input"
            // value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password" className="auth-label">Password:</label>
          <input
            type="password"
            id="password"
            className="auth-input"
            // value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-button">Sign Up</button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
        </div>

      </div>
    </div>
  );
}

export default SignupPage;
