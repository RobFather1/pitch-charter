import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GameSetupPage() {
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const [gameDate, setGameDate] = useState(today);
  const [gameNumber, setGameNumber] = useState('1');

  const handleStartGame = () => {
    if (!gameDate || !gameNumber) {
      alert('Please fill in both the date and game number.');
      return;
    }

    const gameInfo = {
      gameDate,
      gameNumber
    };

    localStorage.setItem('currentGame', JSON.stringify(gameInfo));
    navigate('/charting');
  };

  return (
    <div className="page">
      <h1>⚾ Game Setup</h1>

      <div style={{
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <label>Game Date</label>
        <input
          type="date"
          value={gameDate}
          onChange={e => setGameDate(e.target.value)}
        />

        <label>Game Number</label>
        <select
          value={gameNumber}
          onChange={e => setGameNumber(e.target.value)}
        >
          <option value="1">Game 1</option>
          <option value="2">Game 2</option>
          <option value="3">Game 3</option>
        </select>
      </div>

      <div style={{
        backgroundColor: '#e8f4fd',
        border: '1px solid #b3d9f7',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '24px'
      }}>
        <p style={{ fontSize: '14px', color: '#1a3a5c' }}>
          📋 Game ID will be: <strong>{gameDate}-G{gameNumber}</strong>
        </p>
      </div>

      <button className="btn-primary" onClick={handleStartGame}>
        Start Charting ▶
      </button>

      <div style={{ marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
          Need to update your pitching roster?
        </p>
        <button
          className="btn-secondary"
          style={{ width: '100%' }}
          onClick={() => navigate('/roster')}
        >
          Go to Roster Page
        </button>
      </div>
    </div>
  );
}

export default GameSetupPage;