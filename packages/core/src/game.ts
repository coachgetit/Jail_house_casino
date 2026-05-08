import { GameState, Player, Action, Card, TableEntity } from './types';
import { createDeck, shuffle } from './deck';
import { validateCapture, validateBuild, applyCapture, applyBuild, applyTrail, isCard } from './rules';
import { applyRoundScores } from './scoring';

export function createGame(
  playerNames: string[],
  targetScore = 11,
  options?: { multiplayer?: boolean },
): GameState {
  const players: Player[] = playerNames.map((name, i) => ({
    id: `player-${i}`,
    name,
    hand: [],
    captured: [],
    isAI: options?.multiplayer ? false : i > 0,
  }));

  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = 0;

  const state: GameState = {
    players,
    table: [],
    deck: shuffle(createDeck()),
    currentPlayerIndex: 0,
    dealerIndex: 0,
    lastCapturePlayerId: null,
    roundOver: false,
    gameOver: false,
    scores,
    targetScore,
    roundNumber: 1,
    bonusPayout: false,
  };

  return dealRound(state, true);
}

export function dealRound(state: GameState, isFirstDeal: boolean): GameState {
  let deck = [...state.deck];
  const players = state.players.map(p => ({
    ...p,
    hand: deck.splice(0, 4),
    captured: [] as Card[],
  }));

  // On first deal, also place 4 cards on table
  const table = isFirstDeal ? deck.splice(0, 4) : [...state.table];

  return {
    ...state,
    players,
    deck,
    table,
    lastCapturePlayerId: null,
    roundOver: false,
  };
}

export function dealHands(state: GameState): GameState {
  // Mid-round redeal — deal 4 cards to each player, no new table cards
  let deck = [...state.deck];
  const players = state.players.map(p => ({
    ...p,
    hand: deck.splice(0, 4),
  }));

  return { ...state, players, deck };
}

export function applyAction(action: Action, state: GameState): { state: GameState; error: string | null } {
  if (action.type === 'capture') {
    const error = validateCapture(action, state);
    if (error) return { state, error };
    return { state: advance(applyCapture(action, state)), error: null };
  }

  if (action.type === 'build') {
    const error = validateBuild(action, state);
    if (error) return { state, error };
    return { state: advance(applyBuild(action, state)), error: null };
  }

  // trail
  return { state: advance(applyTrail(action.handCard, state)), error: null };
}

function advance(state: GameState): GameState {
  const allHandsEmpty = state.players.every(p => p.hand.length === 0);

  if (allHandsEmpty) {
    if (state.deck.length === 0) {
      // Round over — score it
      return applyRoundScores(state);
    }
    // Deal new hands
    state = dealHands(state);
  }

  const next = (state.currentPlayerIndex + 1) % state.players.length;
  return { ...state, currentPlayerIndex: next };
}

export function startNewRound(state: GameState): GameState {
  const nextDealer = (state.dealerIndex + 1) % state.players.length;
  const reshuffled: GameState = {
    ...state,
    deck: shuffle(createDeck()),
    dealerIndex: nextDealer,
    currentPlayerIndex: nextDealer,
    roundOver: false,
    bonusPayout: false,
    roundNumber: state.roundNumber + 1,
  };
  return dealRound(reshuffled, true);
}

export function getWinner(state: GameState): Player | null {
  if (!state.gameOver) return null;
  let winner: Player | null = null;
  let top = -1;
  for (const p of state.players) {
    const pts = state.scores[p.id] ?? 0;
    if (pts > top) { top = pts; winner = p; }
  }
  return winner;
}
