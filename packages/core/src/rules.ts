import { Card, Build, TableEntity, CaptureAction, BuildAction, GameState } from './types';
import { cardValue, isFaceCard } from './deck';

export function isCard(entity: TableEntity): entity is Card {
  return 'suit' in entity;
}

export function isBuild(entity: TableEntity): entity is Build {
  return 'cards' in entity;
}

function entityValue(entity: TableEntity): number {
  return isCard(entity) ? cardValue(entity) : entity.value;
}

function entityCards(entity: TableEntity): Card[] {
  return isCard(entity) ? [entity] : entity.cards;
}

// Returns all subsets of an array
function subsets<T>(arr: T[]): T[][] {
  return arr.reduce<T[][]>((acc, val) => [...acc, ...acc.map(s => [...s, val])], [[]]);
}

export function validateCapture(action: CaptureAction, state: GameState): string | null {
  const { handCard, targets } = action;
  const playerId = state.players[state.currentPlayerIndex].id;

  if (targets.length === 0) return 'Must select at least one target to capture';

  // Separate face card and numeric captures
  if (isFaceCard(handCard)) {
    // Face cards can only capture matching rank face cards, one at a time
    for (const t of targets) {
      if (!isCard(t) || t.rank !== handCard.rank) {
        return `${handCard.rank} can only capture matching rank cards`;
      }
    }
    // All targets must be the same rank as handCard — allow multi-capture of same rank
    return null;
  }

  // Numeric capture: targets must sum to handCard value, OR each target individually matches
  const hv = cardValue(handCard);

  // Check if each target individually matches (rank match)
  const allMatchByRank = targets.every(t => isCard(t) && t.rank === handCard.rank);
  if (allMatchByRank) return null;

  // Check if targets sum to handCard value
  // Builds owned by another player cannot be captured unless you hold the matching card
  for (const t of targets) {
    if (isBuild(t) && t.ownerId !== playerId) {
      // Can still capture opponent's build if it matches handCard value
    }
  }

  const sum = targets.reduce((acc, t) => acc + entityValue(t), 0);
  if (sum !== hv) return `Selected cards sum to ${sum}, not ${hv}`;

  return null;
}

export function validateBuild(action: BuildAction, state: GameState): string | null {
  const { handCard, targets, declaredValue } = action;
  const player = state.players[state.currentPlayerIndex];

  if (isFaceCard(handCard)) return 'Cannot build with face cards';
  if (targets.length === 0) return 'Must select table cards to build with';

  for (const t of targets) {
    if (isFaceCard(t)) return 'Cannot include face cards in a build';
  }

  const sum = cardValue(handCard) + targets.reduce((acc, c) => acc + cardValue(c), 0);
  if (sum !== declaredValue) return `Cards sum to ${sum}, not ${declaredValue}`;

  // Player must hold a matching card for next turn UNLESS a matching entity is
  // already on the table (in which case we capture immediately this turn)
  const targetIds = new Set(targets.map(t => t.id));
  const matchingOnTable = state.table.some(
    e => !targetIds.has(e.id) && entityValue(e) === declaredValue,
  );
  const canCapture = player.hand.some(
    c => c.id !== handCard.id && cardValue(c) === declaredValue
  );
  if (!canCapture && !matchingOnTable) {
    return `You must hold a ${declaredValue} in hand to declare this build`;
  }

  return null;
}

export function applyCapture(action: CaptureAction, state: GameState): GameState {
  const player = { ...state.players[state.currentPlayerIndex] };
  const { handCard, targets } = action;

  const targetIds = new Set(targets.map(t => t.id));

  // If any target is a build, also sweep all other table entities with that build's value
  const capturedBuildValue = targets.find(t => isBuild(t)) ? (targets.find(t => isBuild(t)) as Build).value : null;
  const sweepIds = capturedBuildValue !== null
    ? new Set(state.table.filter(e => !targetIds.has(e.id) && entityValue(e) === capturedBuildValue).map(e => e.id))
    : new Set<string>();

  const allCapturedIds = new Set([...targetIds, ...sweepIds]);
  const capturedCards: Card[] = state.table
    .filter(e => allCapturedIds.has(e.id))
    .flatMap(e => entityCards(e));
  capturedCards.push(handCard);

  const newTable = state.table.filter(e => !allCapturedIds.has(e.id));
  const newHand = player.hand.filter(c => c.id !== handCard.id);

  const updatedPlayer: typeof player = {
    ...player,
    hand: newHand,
    captured: [...player.captured, ...capturedCards],
  };

  const players = state.players.map(p => (p.id === player.id ? updatedPlayer : p));

  return {
    ...state,
    players,
    table: newTable,
    lastCapturePlayerId: player.id,
  };
}

export function applyBuild(action: BuildAction, state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const { handCard, targets, declaredValue } = action;

  const targetIds = new Set(targets.map(c => c.id));
  // Table after removing the cards used to form the build
  const tableAfterTargets = state.table.filter(e => !targetIds.has(e.id));

  // If an entity of the same value already sits on the table, capture everything now
  const alreadyOnTable = tableAfterTargets.filter(e => entityValue(e) === declaredValue);
  if (alreadyOnTable.length > 0) {
    const alreadyIds = new Set(alreadyOnTable.map(e => e.id));
    const newHand = player.hand.filter(c => c.id !== handCard.id);
    const capturedCards = [handCard, ...targets, ...alreadyOnTable.flatMap(entityCards)];
    const updatedPlayer = {
      ...player,
      hand: newHand,
      captured: [...player.captured, ...capturedCards],
    };
    return {
      ...state,
      players: state.players.map(p => (p.id === player.id ? updatedPlayer : p)),
      table: tableAfterTargets.filter(e => !alreadyIds.has(e.id)),
      lastCapturePlayerId: player.id,
    };
  }

  // Normal build: leave the build on the table for next turn
  const build: Build = {
    id: `build-${Date.now()}`,
    cards: [handCard, ...targets],
    value: declaredValue,
    ownerId: player.id,
  };

  const newHand = player.hand.filter(c => c.id !== handCard.id);
  const updatedPlayer = { ...player, hand: newHand };

  return {
    ...state,
    players: state.players.map(p => (p.id === player.id ? updatedPlayer : p)),
    table: [...tableAfterTargets, build],
  };
}

export function applyTrail(handCard: Card, state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const newHand = player.hand.filter(c => c.id !== handCard.id);
  const updatedPlayer = { ...player, hand: newHand };
  const players = state.players.map(p => (p.id === player.id ? updatedPlayer : p));

  return {
    ...state,
    players,
    table: [...state.table, handCard],
  };
}
