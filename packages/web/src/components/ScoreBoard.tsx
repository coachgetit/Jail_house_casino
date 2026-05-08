import type { Player, GameState } from '@casino/core';
import { useCosmetics } from '../contexts/CosmeticsContext';

interface Props {
  state: GameState;
  players: Player[];
  avatars?: Record<string, string>;
}

export function ScoreBoard({ state, players, avatars = {} }: Props) {
  const { frameStyle } = useCosmetics();
  return (
    <div className="scoreboard">
      {players.map(p => {
        const isActive =
          state.currentPlayerIndex === state.players.indexOf(p) &&
          !state.roundOver &&
          !state.gameOver;
        const avatar = avatars[p.id];
        return (
          <div key={p.id} className={`score-card${isActive ? ' score-card--active' : ''}`}>
            {avatar && <img src={avatar} alt={p.name} className="avatar avatar--sm" style={{ border: frameStyle }} />}
            <div className="score-name">{p.name}</div>
            <div className="score-value">
              {state.scores[p.id] ?? 0}
              <span className="score-target">/{state.targetScore}</span>
            </div>
            <div className="score-captured">Captured: {p.captured.length}</div>
          </div>
        );
      })}
      <div className="score-card">
        <div className="deck-label">Deck</div>
        <div className="deck-count">{state.deck.length}</div>
        <div className="deck-label">cards left</div>
      </div>
    </div>
  );
}
