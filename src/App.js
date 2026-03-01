import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RosterPage from './pages/RosterPage';
import GameSetupPage from './pages/GameSetupPage';
import ChartingPage from './pages/ChartingPage';
import ExportPage from './pages/ExportPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="nav-bar">
          <Link to="/">⚾ Pitch Charter</Link>
          <Link to="/roster">Roster</Link>
          <Link to="/export">Export</Link>
        </nav>
        <Routes>
          <Route path="/" element={<GameSetupPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/charting" element={<ChartingPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;