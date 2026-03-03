import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeParseJSON } from '../utils/storage';

function ExportPage() {
  const navigate = useNavigate();
  const [pitches, setPitches] = useState([]);
  const [gameInfo, setGameInfo] = useState(null);

  useEffect(() => {
    const savedPitches = localStorage.getItem('currentPitches');
    if (savedPitches) {
      setPitches(safeParseJSON(savedPitches, []));
    }

    const savedGame = localStorage.getItem('currentGame');
    if (savedGame) {
      setGameInfo(safeParseJSON(savedGame, null));
    }
  }, []);

  const escapeCsvField = (value) => {
    const str = value == null ? '' : String(value);
    const safe = ['=', '+', '-', '@'].includes(str[0]) ? "'" + str : str;
    return '"' + safe.replace(/"/g, '""') + '"';
  };

  const handleExport = () => {
    if (pitches.length === 0) {
      alert('No pitches to export yet.');
      return;
    }

    const headers = [
      'pitchNumber',
      'gameDate',
      'gameNumber',
      'gameId',
      'opponent',
      'inning',
      'pitcherNumber',
      'pitcherName',
      'batterNumber',
      'batterName',
      'batterHand',
      'pitchType',
      'velocity',
      'zone',
      'result',
      'outcome'
    ];

    const rows = pitches.map(pitch => [
      pitch.pitchNumber,
      pitch.gameDate,
      pitch.gameNumber,
      pitch.gameId,
      pitch.opponent || '',
      pitch.inning,
      pitch.pitcherNumber,
      pitch.pitcherName,
      pitch.batterNumber,
      pitch.batterName || '',
      pitch.batterHand,
      pitch.pitchType,
      pitch.velocity || '',
      pitch.zone,
      pitch.result,
      pitch.outcome || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const fileName = gameInfo
      ? `pitches-${gameInfo.gameDate}-G${gameInfo.gameNumber}.csv`
      : 'pitches-export.csv';

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleClearGame = () => {
    if (window.confirm(
      'Are you sure you want to clear all pitch data for this game? This cannot be undone.'
    )) {
      localStorage.removeItem('currentPitches');
      localStorage.removeItem('currentBatters');
      localStorage.removeItem('currentGame');
      setPitches([]);
      setGameInfo(null);
      alert('Game data cleared. Ready for a new game.');
      navigate('/');
    }
  };

  const strikes = pitches.filter(p => p.result === 'Strike').length;
  const balls = pitches.filter(p => p.result === 'Ball').length;

  const pitcherSummary = pitches.reduce((acc, pitch) => {
    const key = pitch.pitcherName || 'Unknown';
    if (!acc[key]) acc[key] = { total: 0, strikes: 0, balls: 0 };
    acc[key].total++;
    if (pitch.result === 'Strike') acc[key].strikes++;
    if (pitch.result === 'Ball') acc[key].balls++;
    return acc;
  }, {});

  const inningCounts = pitches.reduce((acc, pitch) => {
    const key = `Inning ${pitch.inning}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page">
      <h1>📤 Export Data</h1>

      {/* Game Summary */}
      {gameInfo ? (
        <div style={{
          backgroundColor: '#1a3a5c',
          color: 'white',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {gameInfo.gameDate} — Game {gameInfo.gameNumber}{gameInfo.opponent ? ` — vs ${gameInfo.opponent}` : ''}
          </p>
          <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>
            Game ID: {gameInfo.gameDate}-G{gameInfo.gameNumber}
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--surface-alt)',
          border: '1px solid var(--surface-alt-border)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '14px' }}>⚠️ No active game found.</p>
        </div>
      )}

      {/* Pitch Stats */}
      {pitches.length > 0 && (
        <>
          {/* Overall Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: 'var(--stat-blue-bg)',
              border: '1px solid var(--stat-blue-border)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-heading)' }}>
                {pitches.length}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Pitches</p>
            </div>
            <div style={{
              backgroundColor: 'var(--stat-red-bg)',
              border: '1px solid var(--stat-red-border)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#cc0000' }}>
                {strikes}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Strikes</p>
            </div>
            <div style={{
              backgroundColor: 'var(--stat-green-bg)',
              border: '1px solid var(--stat-green-border)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#006600' }}>
                {balls}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Balls</p>
            </div>
          </div>

          {/* Pitcher Summary */}
          <h2>By Pitcher</h2>
          <div style={{ marginBottom: '16px' }}>
            {Object.entries(pitcherSummary).map(([name, stats]) => (
              <div key={name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderBottom: '1px solid var(--border-light)',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>{name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {stats.total} pitches —{' '}
                  <span style={{ color: '#cc0000' }}>{stats.strikes} K</span>
                  {' / '}
                  <span style={{ color: '#006600' }}>{stats.balls} B</span>
                  {' '}
                  ({Math.round((stats.strikes / stats.total) * 100)}% strikes)
                </span>
              </div>
            ))}
          </div>

          {/* Inning Summary */}
          <h2>By Inning</h2>
          <div style={{ marginBottom: '20px' }}>
            {Object.entries(inningCounts).map(([inning, count]) => (
              <div key={inning} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderBottom: '1px solid #eee',
                fontSize: '14px'
              }}>
                <span style={{ fontWeight: 'bold' }}>{inning}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{count} pitches</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Export Button */}
      <button
        className="btn-primary"
        onClick={handleExport}
        style={{ marginBottom: '12px' }}
      >
        ⬇️ Download CSV for Excel
      </button>

      {/* Back to Charting */}
      <button
        className="btn-secondary"
        style={{ width: '100%', marginBottom: '12px' }}
        onClick={() => navigate('/charting')}
      >
        ← Back to Charting
      </button>

      {/* Clear Game Button */}
      <button
        className="btn-danger"
        style={{ width: '100%', marginTop: '8px' }}
        onClick={handleClearGame}
      >
        🗑️ Clear Game Data
      </button>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', textAlign: 'center' }}>
        Only clear after you have exported your CSV
      </p>
    </div>
  );
}

export default ExportPage;