import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';

import HomePage from './pages/HomePage';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import UserAuth from './UserAuth';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function App() {
  const [darkTheme, setDarkTheme] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null); // 'admin' or 'user'
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserAuth, setShowUserAuth] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    document.title = 'GDVG - Global Drama Verse Guide';
    
    // Check for admin token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      setIsAuthenticated(true);
      setUserType('admin');
      return;
    }

    // Check for user token
    const userToken = localStorage.getItem('user_token');
    if (userToken) {
      fetchUserProfile(userToken);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
      setIsAuthenticated(true);
      setUserType('user');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      handleLogout();
    }
  };

  const handleLogin = (token, type) => {
    if (type === 'admin') {
      localStorage.setItem('admin_token', token);
      setIsAuthenticated(true);
      setUserType('admin');
    } else {
      localStorage.setItem('user_token', token);
      fetchUserProfile(token);
    }
    setShowUserAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              darkTheme={darkTheme}
              setDarkTheme={setDarkTheme}
              onAuthClick={() => {}}
            />
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated && userType === 'admin'
              ? <AdminDashboard darkTheme={darkTheme} onLogout={handleLogout} />
              : <Navigate to="/admin/login" />
          }
        />
        <Route
          path="/admin/login"
          element={<AdminLogin onLogin={(token) => handleLogin(token, 'admin')} darkTheme={darkTheme} />}
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated && userType === 'user'
              ? <UserDashboard darkTheme={darkTheme} onLogout={handleLogout} currentUser={currentUser} />
              : <Navigate to="/" />
          }
        />
        {/* Add other routes here as they are built */}
      </Routes>
    </Router>
  );
}

export default App;