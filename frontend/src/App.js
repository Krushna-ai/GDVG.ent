import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { supabase } from './supabaseClient';

import HomePage from './pages/HomePage';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import UserAuth from './UserAuth';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Axios interceptor to add the Supabase token to requests
axios.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [darkTheme, setDarkTheme] = useState(true);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'GDVG - Global Drama Verse Guide';
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchUserProfile();
    } else {
      setCurrentUser(null);
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await axios.get(`${API}/auth/me`);
      if (error) throw error;
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !session ? (
              <UserAuth darkTheme={darkTheme} isLogin={true} setIsLogin={() => {}} />
            ) : (
              <HomePage
                darkTheme={darkTheme}
                setDarkTheme={setDarkTheme}
                onAuthClick={handleLogout}
                isAuthenticated={!!session}
              />
            )
          }
        />
        <Route
          path="/login"
          element={<UserAuth darkTheme={darkTheme} isLogin={true} setIsLogin={() => {}} />}
        />
        <Route
          path="/register"
          element={<UserAuth darkTheme={darkTheme} isLogin={false} setIsLogin={() => {}} />}
        />
        <Route
          path="/admin"
          element={
            // Admin auth is not implemented yet
            <Navigate to="/admin/login" />
          }
        />
        <Route
          path="/admin/login"
          element={<AdminLogin onLogin={() => {}} darkTheme={darkTheme} />}
        />
        <Route
          path="/dashboard"
          element={
            session
              ? <UserDashboard darkTheme={darkTheme} onLogout={handleLogout} currentUser={currentUser} />
              : <Navigate to="/login" />
          }
        />
        {/* Add other routes here as they are built */}
      </Routes>
    </Router>
  );
}

export default App;