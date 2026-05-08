import { Card, Build, Stack, Rank, TableEntity, CaptureAction, BuildAction, StackAction, GameState } from './types';
import { cardValue, isFaceCard } from './deck';

export function isCard(entity: TableEntity): entity is Card {
  return 'suit' in entity;
}

export function isBuild(entity: TableEntity): entity is Build {
  return 'cards' in entity && 'value' in entity;
}

export function isStack(entity: TableEntity): entity is Stack {
  return 'cards' in entity && 'rank' in entity && !('suit' in entity);
}

function entityValue(entity: TableEntity): number {
  if (isCard(entity)) return cardValue(entity);
  if (isBuild(entity)) return entity.value;
  return cardValue(entity.cards[0]); // stack: value = rank value
}

function entityCards(entity: TableEntity): Card[] {
  if (isCard(entity)) return [entity];
  return entity.cards; // both Build and Stack have cards[]
}

// Returns all subsets of an array
function subsets<T>(arr: T[]): T[][] {
  return arr.reduce<T[][]>((acc, val) => [...acc, ...acc.map(s => [...s, val])], [[]]);
}

export function validateCapture(action: CaptureAction, state: GameState): string | null {
  const { handCard, targets } = action;
  const playerId = state.players[state.currentPlayerIndex].id;

  if (targets.length === 0) return 'Must select at least one target to capture';

  if (isFaceCard(handCard)) {
    // Face cards can only capture matching rank face cards (multi-capture of same rank is allowed)
    for (const t of targets) {
      if (!isCard(t) || t.rank !== handCard.rank) {
        return `${handCard.rank} can only capture matching rank cards`;
      }
    }
    return null;
  }

  const hv = cardValue(handCard);

  // Rank-match capture: all targets must match hand card rank (cards and stacks allowed)
  const allMatchByRank = targets.every(t =>
    (isCard(t) && t.rank === handCard.rank) ||
    (isStack(t) && t.rank === handCard.rank)
  );
  if (allMatchByRank) return null;

  // Stacks cannot participate in sum captures
  if (targets.some(isStack)) return 'Stacks can only be captured by matching rank';

  // Sum capture: targets (cards + builds) must sum to handCard value
  for (const t of targets) {
    if (isBuild(t) && t.ownerId !== playerId) {
      // Opponent builds are capturable if they match
    }
  }

  const sum = targets.reduce((acc, t) => acc + entityValue(t), 0);
  if (sum !== hv) return `Selected cards sum to ${sum}, not ${hv}`;

  return null;
}

export function validateStack(action: StackAction, state: GameState): string | null {
  const { handCard, handExtras, targets } = action;
  const player = state.players[state.currentPlayerIndex];
  const rank = handCard.rank;

  if (handExtras.length === 0 && targets.length === 0) {
    return 'Select other same-rank cards or an existing stack to group with';
  }

  // All extra hand cards must match rank and belong to player's hand
  const handIds = new Set(player.hand.map(c => c.id));
  for (const c of handExtras) {
    if (c.rank !== rank) return `All hand cards must be rank ${rank}`;
    if (!handIds.has(c.id)) return 'Invalid hand card';
  }

  // All table targets must be same-rank cards or same-rank stacks
  for (const t of targets) {
    if (isCard(t) && t.rank !== rank) return `All table cards must be rank ${rank}`;
    if (isStack(t) && t.rank !== rank) return `Stack must be rank ${rank}`;
    if (isBuild(t)) return 'Cannot stack with builds';
  }

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

  // Sweep remaining entities matching any captured build's value
  const capturedBuildValues = new Set(targets.filter(isBuild).map(t => (t as Build).value));
  const sweepByValue = capturedBuildValues.size > 0
    ? state.table.filter(e => !targetIds.has(e.id) && capturedBuildValues.has(entityValue(e))).map(e => e.id)
    : [];

  // Sweep remaining cards/stacks matching rank when capturing by rank
  const allByRank = targets.every(t =>
    (isCard(t) && t.rank === handCard.rank) ||
    (isStack(t) && t.rank === handCard.rank)
  );
  const sweepByRank = allByRank
    ? state.table.filter(e =>
        !targetIds.has(e.id) &&
        ((isCard(e) && e.rank === handCard.rank) || (isStack(e) && e.rank === handCard.rank))
      ).map(e => e.id)
    : [];

  const allCapturedIds = new Set([...targetIds, ...sweepByValue, ...sweepByRank]);
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

  return {
    ...state,
    players: state.players.map(p => (p.id === player.id ? updatedPlayer : p)),
    table: newTable,
    lastCapturePlayerId: player.id,
  };
}

export function applyStack(action: StackAction, state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const { handCard, handExtras, targets } = action;

  const allHandCards = [handCard, ...handExtras];
  const handIdsToRemove = new Set(allHandCards.map(c => c.id));
  const tableIdsToRemove = new Set(targets.map(t => t.id));

  // Merge all cards into one stack (preserving id if adding to existing stack)
  const existingStack = targets.find(isStack) as Stack | undefined;
  const allCards = [...allHandCards, ...targets.flatMap(t => entityCards(t))];

  const stack: Stack = {
    id: existingStack?.id ?? `stack-${Date.now()}`,
    cards: allCards,
    rank: handCard.rank as Rank,
    ownerId: player.id,
  };

  const newHand = player.hand.filter(c => !handIdsToRemove.has(c.id));
  const updatedPlayer = { ...player, hand: newHand };

  return {
    ...state,
    players: state.players.map(p => p.id === player.id ? updatedPlayer : p),
    table: [...state.table.filter(e => !tableIdsToRemove.has(e.id)), stack],
  };
}

export function applyBuild(action: BuildAction, state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  const { handCard, targets, declaredValue } = action;

  const targetIds = new Set(targets.map(c => c.id));
  const tableAfterTargets = state.table.filter(e => !targetIds.has(e.id));

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
