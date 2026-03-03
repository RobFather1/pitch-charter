import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StrikeZone from '../components/StrikeZone';
import { safeParseJSON, safeSetItem } from '../utils/storage';

const API_URL = process.env.REACT_APP_API_URL || "https://hhr6e3yl4b.execute-api.us-east-2.amazonaws.com/prod";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function ChartingPage() {
  const navigate = useNavigate();

  const [gameInfo, setGameInfo] = useState(null);
  const [pitchers, setPitchers] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedResult, setSelectedResult] = useState('');
  const [pitcher, setPitcher] = useState('');
  const [inning, setInning] = useState('1');
  const [pitchType, setPitchType] = useState('FB');
  const [velocity, setVelocity] = useState('');
  const [outcome, setOutcome] = useState('');
  const [batterNumber, setBatterNumber] = useState('');
  const [batterName, setBatterName] = useState('');
  const [batterHand, setBatterHand] = useState('RHH');
  const [pitches, setPitches] = useState([]);
  const [currentBalls, setCurrentBalls] = useState(0);
  const [currentStrikes, setCurrentStrikes] = useState(0);
  const [showNewBatter, setShowNewBatter] = useState(false);
  const [newBatterNumber, setNewBatterNumber] = useState('');
  const [newBatterName, setNewBatterName] = useState('');
  const [newBatterHand, setNewBatterHand] = useState('RHH');
  const [batters, setBatters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const savePitch = async (pitch) => {
    try {
      await fetch(`${API_URL}/pitches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pitch)
      });
    } catch (error) {
      console.error("Error saving pitch:", error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const savedGame = localStorage.getItem('currentGame');
    if (!savedGame) {
      alert('No game set up. Please set up a game first.');
      navigate('/');
      return;
    }
    const parsedGame = safeParseJSON(savedGame, null);
    if (!parsedGame) {
      alert('Game data is corrupted. Please set up a new game.');
      navigate('/');
      return;
    }
    if (!parsedGame.gameDate || !DATE_PATTERN.test(parsedGame.gameDate)) {
      alert('Game data is invalid. Please set up a new game.');
      navigate('/');
      return;
    }
    setGameInfo(parsedGame);

    const gameId = `${parsedGame.gameDate}-G${parsedGame.gameNumber}`;
    const params = new URLSearchParams({ gameId });
    setLoadError(false);
    fetch(`${API_URL}/pitches?${params}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          console.warn(`Failed to load pitches: ${response.status}`);
          setLoadError(true);
          setPitches([]);
          return undefined;
        }
        return response.json();
      })
      .then(data => {
        if (data !== undefined) {
          setPitches(Array.isArray(data) ? data : []);
        }
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        console.error('Error loading pitches:', error);
        setPitches([]);
        setLoadError(true);
      });

    fetch(`${API_URL}/roster?teamId=main`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPitchers(data);
          if (data.length > 0) setPitcher(data[0].id.toString());
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('Error loading roster:', err);
        const savedPitchers = localStorage.getItem('pitchers');
        if (savedPitchers) {
          const pitcherList = safeParseJSON(savedPitchers, []);
          setPitchers(pitcherList);
          if (pitcherList.length > 0) setPitcher(pitcherList[0].id.toString());
        }
      });

    const savedBatters = localStorage.getItem('currentBatters');
    if (savedBatters) {
      setBatters(safeParseJSON(savedBatters, []));
    }

    return () => controller.abort();
  }, [navigate]);

  const handleZoneSelect = (zoneNum, result) => {
    setSelectedZone(zoneNum);
    setSelectedResult(result);
  };

  const handleNextBatter = () => {
    setBatterNumber('');
    setBatterName('');
    setBatterHand('RHH');
    setSelectedZone(null);
    setSelectedResult('');
    setVelocity('');
    setOutcome('');
    setCurrentBalls(0);
    setCurrentStrikes(0);
  };

  const handleAddBatter = () => {
    const jerseyNum = parseInt(newBatterNumber, 10);
    if (!newBatterNumber || isNaN(jerseyNum) || jerseyNum < 0 || jerseyNum > 99) {
      alert('Please enter a valid jersey number (0–99).');
      return;
    }
    const isDuplicate = batters.some(b => b.number === String(jerseyNum));
    if (isDuplicate) {
      alert(`Batter #${jerseyNum} is already in the lineup.`);
      return;
    }
    const newBatter = {
      id: Date.now(),
      number: newBatterNumber,
      name: newBatterName.trim(),
      hand: newBatterHand
    };
    const updatedBatters = [...batters, newBatter];
    setBatters(updatedBatters);
    safeSetItem('currentBatters', JSON.stringify(updatedBatters));
    setBatterNumber(newBatter.number);
    setBatterName(newBatter.name);
    setBatterHand(newBatter.hand);
    setNewBatterNumber('');
    setNewBatterName('');
    setNewBatterHand('RHH');
    setShowNewBatter(false);
  };

  const handleBatterSelect = (batterId) => {
    if (batterId === 'new') {
      setShowNewBatter(true);
      return;
    }
    const batter = batters.find(b => b.id.toString() === batterId);
    if (batter) {
      setBatterNumber(batter.number);
      setBatterName(batter.name);
      setBatterHand(batter.hand);
    }
  };

  const handleLogPitch = () => {
    if (saving) return;
    if (!selectedZone) {
      alert('Please select a zone on the strike zone grid.');
      return;
    }
    if (!pitcher) {
      alert('Please select a pitcher.');
      return;
    }
    if (!batterNumber) {
      alert('Please select or add a batter.');
      return;
    }

    const selectedPitcher = pitchers.find(p => p.id.toString() === pitcher);

    const newPitch = {
      id: Date.now(),
      gameDate: gameInfo.gameDate,
      gameNumber: gameInfo.gameNumber,
      gameId: `${gameInfo.gameDate}-G${gameInfo.gameNumber}`,
      opponent: gameInfo.opponent || '',
      pitchNumber: pitches.length + 1,
      inning: parseInt(inning),
      pitcherName: selectedPitcher ? selectedPitcher.name : '',
      pitcherNumber: selectedPitcher ? selectedPitcher.number : '',
      batterNumber,
      batterName,
      batterHand,
      pitchType,
      velocity: velocity ? Math.min(99, Math.max(50, parseFloat(parseFloat(velocity).toFixed(1)))) : '',
      ballCount: currentBalls,
      strikeCount: currentStrikes,
      zone: selectedZone,
      result: selectedResult,
      outcome: outcome
    };

    setSaving(true);
    const updatedPitches = [...pitches, newPitch];
    setPitches(updatedPitches);
    safeSetItem('currentPitches', JSON.stringify(updatedPitches));
    savePitch(newPitch);
    setSaving(false);

    if (selectedResult === 'Ball') {
      setCurrentBalls(prev => prev + 1);
    } else {
      setCurrentStrikes(prev => prev + 1);
    }

    setSelectedZone(null);
    setSelectedResult('');
    setVelocity('');
    setOutcome('');
  };

  const handleUndoLastPitch = () => {
    if (pitches.length === 0) return;
    if (window.confirm('Remove the last pitch?')) {
      const updatedPitches = pitches.slice(0, -1);
      setPitches(updatedPitches);
      safeSetItem('currentPitches', JSON.stringify(updatedPitches));
    }
  };

  return (
    <div className="page">

      {/* Game Info Bar */}
      {gameInfo && (
        <div style={{
          backgroundColor: '#1a3a5c',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>📅 {gameInfo.gameDate}</span>
          {gameInfo.opponent && <span>vs {gameInfo.opponent}</span>}
          <span>Game {gameInfo.gameNumber}</span>
          <span>Pitches: {pitches.length}</span>
        </div>
      )}

      {/* API Load Error Banner */}
      {loadError && (
        <div style={{
          backgroundColor: 'var(--stat-red-bg)',
          border: '1px solid var(--stat-red-border)',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '8px',
          fontSize: '13px',
          color: 'var(--text-primary)'
        }}>
          Could not load pitches from server. Showing locally saved data.
        </div>
      )}

      {/* Inning & Pitcher Row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <label>Inning</label>
          <select value={inning} onChange={e => setInning(e.target.value)}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label>Pitcher</label>
          <select value={pitcher} onChange={e => setPitcher(e.target.value)}>
            <option value="">-- Select --</option>
            {pitchers
              .sort((a, b) => Number(a.number) - Number(b.number))
              .map(p => (
                <option key={p.id} value={p.id}>
                  #{p.number} - {p.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Batter Row */}
      <div style={{ marginBottom: '8px' }}>
        <label>Batter</label>
        <select
          value={batterNumber ? batters.find(b => b.number === batterNumber)?.id.toString() || '' : ''}
          onChange={e => handleBatterSelect(e.target.value)}
        >
          <option value="">-- Select or Add Batter --</option>
          {batters.map(b => (
            <option key={b.id} value={b.id}>
              #{b.number}{b.name ? ` - ${b.name}` : ''} ({b.hand})
            </option>
          ))}
          <option value="new">➕ Add New Batter</option>
        </select>
      </div>

      {/* New Batter Form */}
      {showNewBatter && (
        <div style={{
          backgroundColor: 'var(--surface-alt)',
          border: '1px solid var(--surface-alt-border)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <h2>➕ Add New Batter</h2>
          <label>Jersey Number</label>
          <input
            type="number"
            placeholder="e.g. 14"
            min="0"
            max="99"
            step="1"
            value={newBatterNumber}
            onChange={e => setNewBatterNumber(e.target.value)}
          />
          <label>Name (optional)</label>
          <input
            type="text"
            placeholder="e.g. Mike Johnson"
            value={newBatterName}
            onChange={e => setNewBatterName(e.target.value)}
          />
          <label>Bats</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => setNewBatterHand('RHH')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: newBatterHand === 'RHH' ? '#1a3a5c' : '#e0e0e0',
                color: newBatterHand === 'RHH' ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              RHH
            </button>
            <button
              onClick={() => setNewBatterHand('LHH')}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: newBatterHand === 'LHH' ? '#1a3a5c' : '#e0e0e0',
                color: newBatterHand === 'LHH' ? 'white' : '#333',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              LHH
            </button>
          </div>
          <button className="btn-primary" onClick={handleAddBatter}>
            Add Batter
          </button>
          <button
            className="btn-secondary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => setShowNewBatter(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Current Batter Info + Next Batter Button */}
      {batterNumber && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            🧢 <strong>#{batterNumber}</strong>
            {batterName && ` - ${batterName}`}
            {' '}
            <span style={{
              backgroundColor: batterHand === 'RHH' ? '#1a3a5c' : '#8B0000',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>{batterHand}</span>
          </span>
          <button
            onClick={handleNextBatter}
            style={{
              backgroundColor: '#4CBB17',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Next Batter ▶
          </button>
        </div>
      )}

      {/* Strike Zone */}
      <StrikeZone
        selectedZone={selectedZone}
        onZoneSelect={handleZoneSelect}
        pitches={pitches}
      />

      {/* Ball Strike Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        padding: '10px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        marginTop: '10px',
        marginBottom: '10px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#aaa', fontSize: '11px', marginBottom: '2px' }}>BALLS</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: i < currentBalls ? '#4CBB17' : '#444',
                border: '2px solid #666'
              }} />
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#aaa', fontSize: '11px', marginBottom: '2px' }}>STRIKES</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: i < currentStrikes ? '#cc0000' : '#444',
                border: '2px solid #666'
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Pitch Type & Velocity */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <div style={{ flex: 1 }}>
          <label>Pitch Type</label>
          <select value={pitchType} onChange={e => setPitchType(e.target.value)}>
            <option value="FB">FB - Fastball</option>
            <option value="CV">CV - Curveball</option>
            <option value="SL">SL - Slider</option>
            <option value="CH">CH - Changeup</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Velocity (mph)</label>
          <input
            type="number"
            placeholder="e.g. 84.5"
            min="50"
            max="99"
            step="0.1"
            value={velocity}
            onChange={e => setVelocity(e.target.value)}
          />
        </div>
      </div>

      {/* Outcome */}
      <div style={{ marginTop: '8px' }}>
        <label>Outcome</label>
        <select value={outcome} onChange={e => setOutcome(e.target.value)}>
          <option value="">-- Select Outcome (optional) --</option>
          <option value="FC">FC - Fielder's Choice</option>
          <option value="Foul">Foul</option>
          <option value="Foul Out">Foul Out</option>
          <option value="HBP">HBP - Hit By Pitch</option>
          <option value="Hit">Hit</option>
          <option value="Strikeout">Strikeout</option>
          <option value="Walk">Walk</option>
        </select>
      </div>

      {/* Log Pitch Button */}
      <button
        className="btn-primary"
        onClick={handleLogPitch}
        disabled={saving}
        style={{ marginTop: '12px' }}
      >
        ⚾ LOG PITCH
      </button>

      {/* Undo Button */}
      {pitches.length > 0 && (
        <button
          className="btn-secondary"
          onClick={handleUndoLastPitch}
          style={{ width: '100%', marginTop: '8px' }}
        >
          ↩ Undo Last Pitch
        </button>
      )}

      {/* Recent Pitches */}
      {pitches.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Recent Pitches</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#1a3a5c', color: 'white' }}>
                  <th style={{ padding: '6px' }}>#</th>
                  <th style={{ padding: '6px' }}>Inn</th>
                  <th style={{ padding: '6px' }}>Pitcher</th>
                  <th style={{ padding: '6px' }}>Bat</th>
                  <th style={{ padding: '6px' }}>Type</th>
                  <th style={{ padding: '6px' }}>Vel</th>
                  <th style={{ padding: '6px' }}>Zone</th>
                  <th style={{ padding: '6px' }}>Result</th>
                  <th style={{ padding: '6px' }}>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {[...pitches].reverse().slice(0, 10).map((pitch, index) => (
                  <tr key={pitch.id} style={{
                    backgroundColor: index % 2 === 0 ? 'var(--table-row-alt)' : 'var(--table-row)',
                    textAlign: 'center'
                  }}>
                    <td style={{ padding: '6px' }}>{pitch.pitchNumber}</td>
                    <td style={{ padding: '6px' }}>{pitch.inning}</td>
                    <td style={{ padding: '6px' }}>{pitch.pitcherName}</td>
                    <td style={{ padding: '6px' }}>#{pitch.batterNumber}</td>
                    <td style={{ padding: '6px' }}>{pitch.pitchType}</td>
                    <td style={{ padding: '6px' }}>{pitch.velocity !== '' && pitch.velocity != null ? parseFloat(pitch.velocity).toFixed(1) : '-'}</td>
                    <td style={{ padding: '6px' }}>{pitch.zone}</td>
                    <td style={{ padding: '6px', color: pitch.result === 'Strike' ? '#cc0000' : '#0055cc', fontWeight: 'bold' }}>
                      {pitch.result}
                    </td>
                    <td style={{ padding: '6px' }}>{pitch.outcome || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Showing last 10 pitches. Total: {pitches.length}
          </p>
        </div>
      )}
    </div>
  );
}

export default ChartingPage;