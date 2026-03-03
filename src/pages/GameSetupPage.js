import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || "https://hhr6e3yl4b.execute-api.us-east-2.amazonaws.com/prod";

function GameSetupPage() {
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const [mode, setMode] = useState('new'); // 'new' or 'join'

  // New game fields
  const [gameDate, setGameDate] = useState(today);
  const [gameNumber, setGameNumber] = useState('1');
  const [opponent, setOpponent] = useState('');

  // Join game fields
  const [joinGameID, setJoinGameID] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleStartGame = async () => {
    if (!gameDate || !gameNumber) {
      alert('Please fill in both the date and game number.');
      return;
    }

    const gameID = `${gameDate}-G${gameNumber}`;
    const gameInfo = {
      gameID,
      gameDate,
      gameNumber,
      opponent: opponent.trim()
    };

    try {
      await fetch(`${API_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameInfo)
      });
    } catch (err) {
      console.error('Failed to create game on server:', err);
    }

    localStorage.setItem('currentGame', JSON.stringify(gameInfo));
    navigate('/charting');
  };

  const handleJoinGame = async () => {
    const trimmedID = joinGameID.trim();
    if (!trimmedID) {
      setJoinError('Please enter a Game ID.');
      return;
    }

    setJoining(true);
    setJoinError('');

    try {
      const res = await fetch(`${API_URL}/games?gameID=${encodeURIComponent(trimmedID)}`);
      if (!res.ok) {
        setJoinError('Game not found. Please check the ID and try again.');
        setJoining(false);
        return;
      }
      const gameInfo = await res.json();
      localStorage.setItem('currentGame', JSON.stringify(gameInfo));
      navigate('/charting');
    } catch (err) {
      console.error('Error joining game:', err);
      setJoinError('Game not found. Please check the ID and try again.');
      setJoining(false);
    }
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setJoinError('');
  };

  return (
    <div className="page">
      <h1>⚾ Game Setup</h1>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={mode === 'new' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
          onClick={() => handleModeSwitch('new')}
        >
          Start New Game
        </button>
        <button
          className={mode === 'join' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
          onClick={() => handleModeSwitch('join')}
        >
          Join Existing Game
        </button>
      </div>

      {mode === 'new' && (
        <>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--surface-border)',
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

            <label>Opponent</label>
            <input
              type="text"
              placeholder="e.g. Hill Valley High"
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
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
            backgroundColor: 'var(--surface-alt)',
            border: '1px solid var(--surface-alt-border)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-heading)' }}>
              📋 Game ID will be: <strong>{gameDate}-G{gameNumber}</strong>
            </p>
          </div>

          <button className="btn-primary" onClick={handleStartGame}>
            Start Charting ▶
          </button>
        </>
      )}

      {mode === 'join' && (
        <>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <label>Game ID</label>
            <input
              type="text"
              placeholder="e.g. 2026-05-14-G1"
              value={joinGameID}
              onChange={e => { setJoinGameID(e.target.value); setJoinError(''); }}
            />
          </div>

          {joinError && (
            <div style={{
              backgroundColor: 'var(--stat-red-bg)',
              border: '1px solid var(--stat-red-border)',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '16px',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}>
              {joinError}
            </div>
          )}

          <button className="btn-primary" onClick={handleJoinGame} disabled={joining}>
            {joining ? 'Joining...' : 'Join Game ▶'}
          </button>
        </>
      )}

      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
