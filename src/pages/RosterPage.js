import React, { useState } from 'react';

function RosterPage() {
  const [pitchers, setPitchers] = useState(() => {
    const saved = localStorage.getItem('pitchers');
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [editingId, setEditingId] = useState(null);

  const savePitchers = (updatedList) => {
    setPitchers(updatedList);
    localStorage.setItem('pitchers', JSON.stringify(updatedList));
  };

  const handleAdd = () => {
    if (!name || !number) {
      alert('Please enter both a name and number.');
      return;
    }

    if (editingId !== null) {
      const updated = pitchers.map(p =>
        p.id === editingId ? { ...p, name, number } : p
      );
      savePitchers(updated);
      setEditingId(null);
    } else {
      const newPitcher = {
        id: Date.now(),
        name,
        number
      };
      savePitchers([...pitchers, newPitcher]);
    }

    setName('');
    setNumber('');
  };

  const handleEdit = (pitcher) => {
    setName(pitcher.name);
    setNumber(pitcher.number);
    setEditingId(pitcher.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this pitcher?')) {
      savePitchers(pitchers.filter(p => p.id !== id));
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
        <p style={{ color: '#888', marginBottom: '20px' }}>
          No pitchers added yet.
        </p>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          {pitchers
            .sort((a, b) => Number(a.number) - Number(b.number))
            .map(pitcher => (
              <div key={pitcher.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid #eee',
                backgroundColor: editingId === pitcher.id ? '#fff8e1' : 'white'
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
                    onClick={() => handleDelete(pitcher.id)}
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
        type="number"
        placeholder="e.g. 21"
        value={number}
        onChange={e => setNumber(e.target.value)}
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