import { GameState, Action, Card, TableEntity, Build } from './types';
import { cardValue, isFaceCard } from './deck';
import { isCard, isBuild, validateCapture, validateBuild } from './rules';

function allSubsets<T>(arr: T[]): T[][] {
  return arr.reduce<T[][]>((acc, val) => [...acc, ...acc.map(s => [...s, val])], [[]]).filter(s => s.length > 0);
}

function findCaptures(handCard: Card, table: TableEntity[], playerId: string): TableEntity[][] {
  const hv = cardValue(handCard);
  const results: TableEntity[][] = [];

  if (isFaceCard(handCard)) {
    const matches = table.filter(e => isCard(e) && e.rank === handCard.rank);
    if (matches.length > 0) results.push(matches);
    return results;
  }

  // Single rank matches
  const rankMatches = table.filter(e => isCard(e) && e.rank === handCard.rank);
  if (rankMatches.length > 0) results.push(rankMatches);

  // Sum captures using subsets
  for (const subset of allSubsets(table)) {
    const sum = subset.reduce((acc, e) => acc + (isCard(e) ? cardValue(e) : e.value), 0);
    if (sum === hv) results.push(subset);
  }

  return results;
}

export function aiChooseAction(state: GameState): Action {
  const player = state.players[state.currentPlayerIndex];

  // Try to find a capture
  for (const handCard of player.hand) {
    const captures = findCaptures(handCard, state.table, player.id);
    if (captures.length > 0) {
      // Pick the capture that takes the most cards
      const best = captures.sort((a, b) => b.length - a.length)[0];
      const action = { type: 'capture' as const, handCard, targets: best };
      if (!validateCapture(action, state)) return action;
    }
  }

  // Try to build if we hold a pair that allows it
  for (const handCard of player.hand) {
    if (isFaceCard(handCard)) continue;
    const hv = cardValue(handCard);
    const tableCards = state.table.filter(isCard).filter(c => !isFaceCard(c));

    for (const tableCard of tableCards) {
      const sum = hv + cardValue(tableCard);
      if (sum <= 10) {
        const hasCapture = player.hand.some(c => c.id !== handCard.id && cardValue(c) === sum);
        if (hasCapture) {
          const action = {
            type: 'build' as const,
            handCard,
            targets: [tableCard],
            declaredValue: sum,
          };
          if (!validateBuild(action, state)) return action;
        }
      }
    }
  }

  // Trail lowest value card
  const sorted = [...player.hand].sort((a, b) => cardValue(a) - cardValue(b));
  return { type: 'trail', handCard: sorted[0] };
}
