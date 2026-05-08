import { Player, Score, GameState } from './types';
import { isBigCasino, isLittleCasino } from './deck';

export function scoreRound(players: Player[], lastCapturePlayerId: string | null): Score[] {
  // Player with most cards gets 3 points; ties = no one gets it
  const cardCounts = players.map(p => p.captured.length);
  const maxCards = Math.max(...cardCounts);
  const mostCardsWinners = players.filter(p => p.captured.length === maxCards);

  // Player with most spades gets 1 point; ties = no one gets it
  const spadeCounts = players.map(p => p.captured.filter(c => c.suit === 'spades').length);
  const maxSpades = Math.max(...spadeCounts);
  const mostSpadesWinners = players.filter(
    p => p.captured.filter(c => c.suit === 'spades').length === maxSpades
  );

  return players.map(player => {
    const aces = player.captured.filter(c => c.rank === 'A').length;
    const bigCasino = player.captured.some(isBigCasino);
    const littleCasino = player.captured.some(isLittleCasino);
    const spades = player.captured.filter(c => c.suit === 'spades').length;

    let points = 0;
    if (mostCardsWinners.length === 1 && mostCardsWinners[0].id === player.id) points += 3;
    if (mostSpadesWinners.length === 1 && mostSpadesWinners[0].id === player.id) points += 1;
    if (bigCasino) points += 2;
    if (littleCasino) points += 1;
    points += aces;

    return {
      playerId: player.id,
      cards: player.captured.length,
      spades,
      aces,
      bigCasino,
      littleCasino,
      points,
    };
  });
}

export function applyRoundScores(state: GameState): GameState {
  // Give remaining table cards to last capturer
  let players = [...state.players];
  if (state.lastCapturePlayerId) {
    const idx = players.findIndex(p => p.id === state.lastCapturePlayerId);
    if (idx !== -1) {
      const tableCards = state.table.flatMap(e => ('suit' in e ? [e] : e.cards));
      players[idx] = {
        ...players[idx],
        captured: [...players[idx].captured, ...tableCards],
      };
    }
  }

  const roundScores = scoreRound(players, state.lastCapturePlayerId);
  const multiplier = state.roundNumber === 1 ? 2 : 1;
  const newScores = { ...state.scores };
  for (const s of roundScores) {
    newScores[s.playerId] = (newScores[s.playerId] ?? 0) + s.points * multiplier;
  }

  const gameOver = Object.values(newScores).some(pts => pts >= state.targetScore);

  // Bonus: one player swept every scoring point in round 1
  const bonusPayout =
    state.roundNumber === 1 &&
    roundScores.filter(s => s.points > 0).length === 1;

  return {
    ...state,
    players,
    table: [],
    scores: newScores,
    roundOver: true,
    gameOver,
    bonusPayout,
  };
}
