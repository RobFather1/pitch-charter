import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RosterPage from './pages/RosterPage';
import GameSetupPage from './pages/GameSetupPage';
import ChartingPage from './pages/ChartingPage';
import ExportPage from './pages/ExportPage';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import './App.css';

function AppContent() {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="App" data-theme={darkMode ? 'dark' : 'light'}>
      <nav className="nav-bar">
        <Link to="/">⚾ Pitch Charter</Link>
        <Link to="/roster">Roster</Link>
        <Link to="/export">Export</Link>
        <button className="dark-mode-toggle" onClick={toggleDarkMode} title="Toggle dark mode">
          {darkMode ? '☀' : '☾'}
        </button>
      </nav>
      <Routes>
        <Route path="/" element={<GameSetupPage />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/charting" element={<ChartingPage />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <AppContent />
      </Router>
    </DarkModeProvider>
  );
}

export default App;