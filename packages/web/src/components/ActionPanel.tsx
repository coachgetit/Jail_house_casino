import { useState } from 'react';
import type { Card, TableEntity } from '@casino/core';

interface Props {
  selectedHandCard: Card | null;
  selectedTargets: TableEntity[];
  onCapture: () => void;
  onBuild: (value: number) => void;
  onTrail: () => void;
  error: string | null;
  disabled: boolean;
}

export function ActionPanel({ selectedHandCard, selectedTargets, onCapture, onBuild, onTrail, error, disabled }: Props) {
  const [buildValue, setBuildValue] = useState('');

  const hasHand    = !!selectedHandCard;
  const hasTargets = selectedTargets.length > 0;

  const handleBuild = () => {
    const v = parseInt(buildValue);
    if (!isNaN(v)) { onBuild(v); setBuildValue(''); }
  };

  const btnCls = (color: string, active: boolean) =>
    `btn ${active ? color : ''}`.trim() || 'btn';

  return (
    <div className="action-panel">
      {selectedHandCard && (
        <span className="action-selected-info">
          Selected: <strong>{selectedHandCard.rank} of {selectedHandCard.suit}</strong>
          {hasTargets && <> + {selectedTargets.length} table card(s)</>}
        </span>
      )}

      <div className="action-buttons">
        <button
          className={btnCls('btn-green', !disabled && hasHand && hasTargets)}
          disabled={disabled || !hasHand || !hasTargets}
          onClick={onCapture}
        >
          Capture
        </button>

        <div className="build-row">
          <input
            type="number"
            min={1} max={10}
            value={buildValue}
            onChange={e => setBuildValue(e.target.value)}
            placeholder="Val"
            className="build-input"
          />
          <button
            className={btnCls('btn-indigo', !disabled && hasHand && hasTargets && buildValue !== '')}
            disabled={disabled || !hasHand || !hasTargets || buildValue === ''}
            onClick={handleBuild}
          >
            Build
          </button>
        </div>

        <button
          className={btnCls('btn-amber', !disabled && hasHand)}
          disabled={disabled || !hasHand}
          onClick={onTrail}
        >
          Trail
        </button>
      </div>

      {error && <div className="action-error">{error}</div>}
    </div>
  );
}
