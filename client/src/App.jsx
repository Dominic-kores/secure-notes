// client/src/App.jsx
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import NotesDashboard from './components/NotesDashboard';
import './App.css';


function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) return <div className="loading">Loading...</div>;

  if (user) return <NotesDashboard />;

  return (
    <div className="auth-container">
      <h1 className="app-title">Secure Notes</h1>
      <p className="app-subtitle">Your private, secure note-taking app</p>
      {showRegister ? (
        <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}