import React from 'react';

const GRID_SIZE = 5;

const getZoneLabel = (row, col) => {
  const isStrike = row >= 1 && row <= 3 && col >= 1 && col <= 3;
  return isStrike ? 'S' : 'B';
};

const getZoneNumber = (row, col) => {
  return row * GRID_SIZE + col + 1;
};

const getZoneColor = (row, col, selectedZone, pitches) => {
  const zoneNum = getZoneNumber(row, col);
  const isStrike = row >= 1 && row <= 3 && col >= 1 && col <= 3;

  if (selectedZone === zoneNum) {
    return isStrike ? '#ff6600' : '#ff9900';
  }

  const zonePitches = pitches.filter(p => p.zone === zoneNum);
  if (zonePitches.length > 0) {
    const lastPitch = zonePitches[zonePitches.length - 1];
    return lastPitch.result === 'Strike' ? '#ffcccc' : '#cce5ff';
  }

  if (isStrike) return '#ffffff';
  return '#e8e8e8';
};

function StrikeZone({ selectedZone, onZoneSelect, pitches = [] }) {
  return (
    <div style={{ padding: '8px 0' }}>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '8px',
        fontSize: '12px',
        justifyContent: 'center'
      }}>
        <span>
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #999',
            marginRight: '4px'
          }}></span>
          Strike Zone
        </span>
        <span>
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            backgroundColor: '#e8e8e8',
            border: '1px solid #999',
            marginRight: '4px'
          }}></span>
          Ball Zone
        </span>
        <span>
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            backgroundColor: '#ff6600',
            border: '1px solid #999',
            marginRight: '4px'
          }}></span>
          Selected
        </span>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '3px',
        backgroundColor: '#999',
        border: '2px solid #333',
        borderRadius: '4px',
        padding: '3px',
        maxWidth: '300px',
        margin: '0 auto'
      }}>
        {Array.from({ length: GRID_SIZE }, (_, row) =>
          Array.from({ length: GRID_SIZE }, (_, col) => {
            const zoneNum = getZoneNumber(row, col);
            const isStrike = row >= 1 && row <= 3 && col >= 1 && col <= 3;
            const bgColor = getZoneColor(row, col, selectedZone, pitches);
            const isSelected = selectedZone === zoneNum;

            return (
              <div
                key={zoneNum}
                onClick={() => onZoneSelect(zoneNum, isStrike ? 'Strike' : 'Ball')}
                style={{
                  backgroundColor: bgColor,
                  height: '54px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  border: isSelected ? '2px solid #cc4400' : '1px solid #ccc',
                  fontSize: '11px',
                  color: '#555',
                  userSelect: 'none',
                  transition: 'background-color 0.1s'
                }}
              >
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  {isStrike ? 'S' : 'B'}
                </span>
                <span style={{ fontSize: '10px', color: '#888' }}>
                  {zoneNum}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Home Plate */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
        <svg width="80" height="40" viewBox="0 0 80 40">
          <polygon
            points="10,0 70,0 70,20 40,38 10,20"
            fill="white"
            stroke="#333"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Selected Zone Info */}
      {selectedZone && (
        <div style={{
          textAlign: 'center',
          marginTop: '8px',
          padding: '6px',
          backgroundColor: '#fff3e0',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          Zone {selectedZone} selected —{' '}
          <strong>
            {selectedZone && (() => {
              const row = Math.floor((selectedZone - 1) / GRID_SIZE);
              const col = (selectedZone - 1) % GRID_SIZE;
              return row >= 1 && row <= 3 && col >= 1 && col <= 3 ? 'STRIKE' : 'BALL';
            })()}
          </strong>
        </div>
      )}
    </div>
  );
}

export default StrikeZone;