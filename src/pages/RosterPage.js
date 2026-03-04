import React, { useState, useEffect } from 'react';
import { safeParseJSON, safeSetItem } from '../utils/storage';

const API_URL = process.env.REACT_APP_API_URL || "https://hhr6e3yl4b.execute-api.us-east-2.amazonaws.com/prod";

function RosterPage() {
  const [pitchers, setPitchers] = useState([]);

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/roster?teamID=main`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPitchers(data);
          safeSetItem('pitchers', JSON.stringify(data));
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('pitchers');
        setPitchers(safeParseJSON(saved, []));
      });
  }, []);

  const savePitchers = (updatedList) => {
    setPitchers(updatedList);
    safeSetItem('pitchers', JSON.stringify(updatedList));
  };

  const handleAdd = () => {
    const trimmedName = name.trim();
    const jerseyNum = parseInt(number, 10);
    if (!trimmedName || !number || isNaN(jerseyNum) || jerseyNum < 0 || jerseyNum > 99) {
      alert('Please enter a name and a valid jersey number (0–99).');
      return;
    }
    const isDuplicate = pitchers.some(
      p => p.number === String(jerseyNum) && (p.pitcherID || p.id) !== editingId
    );
    if (isDuplicate) {
      alert(`Jersey #${jerseyNum} is already in the roster.`);
      return;
    }

    let syncId;
    if (editingId !== null) {
      const updated = pitchers.map(p =>
        (p.pitcherID || p.id) === editingId ? { ...p, name: trimmedName, number } : p
      );
      savePitchers(updated);
      syncId = editingId;
      setEditingId(null);
    } else {
      const newPitcher = {
        id: Date.now(),
        name: trimmedName,
        number
      };
      savePitchers([...pitchers, newPitcher]);
      syncId = newPitcher.id;
    }

    fetch(`${API_URL}/roster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamID: 'main', pitcherID: syncId.toString(), name: trimmedName, number })
    }).catch(err => console.error('Failed to save pitcher to cloud:', err));

    setName('');
    setNumber('');
  };

  const handleEdit = (pitcher) => {
    setName(pitcher.name);
    setNumber(pitcher.number);
    setEditingId(pitcher.pitcherID || pitcher.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this pitcher?')) {
      savePitchers(pitchers.filter(p => (p.pitcherID || p.id) !== id));
      fetch(`${API_URL}/roster`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamID: 'main', pitcherID: id.toString() })
      }).catch(err => console.error('Failed to delete pitcher from cloud:', err));
    }
  };

  const handleCancel = () => {
    setName('');
    setNumber('');
    setEditingId(null);
  };

  return (
    <div className="page">
      <h1>⚾ Pitcher Roster</h1>

      {/* Pitcher List */}
      {pitchers.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          No pitchers added yet.
        </p>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          {pitchers
            .sort((a, b) => Number(a.number) - Number(b.number))
            .map(pitcher => (
              <div key={pitcher.pitcherID || pitcher.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid var(--border-light)',
                backgroundColor: editingId === (pitcher.pitcherID || pitcher.id) ? 'var(--roster-editing-bg)' : 'var(--app-bg)'
              }}>
                <span style={{ fontSize: '16px' }}>
                  #{pitcher.number} — {pitcher.name}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => handleEdit(pitcher)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(pitcher.pitcherID || pitcher.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add / Edit Form */}
      <h2>{editingId ? '✏️ Edit Pitcher' : '➕ Add Pitcher'}</h2>

      <label>Jersey Number</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="e.g. 21"
        maxLength={2}
        value={number}
        onChange={e => setNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
      />

      <label>Pitcher Name</label>
      <input
        type="text"
        placeholder="e.g. John Smith"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <button className="btn-primary" onClick={handleAdd}>
        {editingId ? 'Save Changes' : 'Add Pitcher'}
      </button>

      {editingId && (
        <button
          className="btn-secondary"
          onClick={handleCancel}
          style={{ width: '100%', marginTop: '8px' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

export default RosterPage;