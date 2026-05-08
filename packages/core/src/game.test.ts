import { createGame, applyAction, getWinner } from './game';
import { cardValue, isBigCasino, isLittleCasino } from './deck';
import { scoreRound } from './scoring';
import { Card, Player } from './types';

function makeCard(rank: string, suit: string): Card {
  return { rank: rank as any, suit: suit as any, id: `${rank}-${suit}` };
}

describe('deck', () => {
  test('deck has 52 unique cards', () => {
    const { deck, table, players } = createGame(['Alice', 'Bob']);
    const all = [...deck, ...table, ...players.flatMap(p => p.hand)];
    expect(all.length).toBe(52);
    const ids = new Set(all.map(c => c.id));
    expect(ids.size).toBe(52);
  });
});

describe('createGame', () => {
  test('deals 4 cards to each player and 4 to table', () => {
    const state = createGame(['Alice', 'Bob']);
    expect(state.players[0].hand.length).toBe(4);
    expect(state.players[1].hand.length).toBe(4);
    expect(state.table.length).toBe(4);
  });
});

describe('capture action', () => {
  test('player captures matching rank card', () => {
    const state = createGame(['Alice', 'Bob']);
    const player = state.players[0];
    const handCard = player.hand[0];

    // Put a matching card on the table
    const matchCard = makeCard(handCard.rank, 'hearts');
    const testState = { ...state, table: [matchCard] };

    const { state: newState, error } = applyAction(
      { type: 'capture', handCard, targets: [matchCard] },
      testState
    );
    expect(error).toBeNull();
    const updatedPlayer = newState.players.find(p => p.id === player.id)!;
    expect(updatedPlayer.captured).toContainEqual(handCard);
    expect(updatedPlayer.captured).toContainEqual(matchCard);
  });

  test('rejects capture when sum does not match', () => {
    const state = createGame(['Alice', 'Bob']);
    const player = state.players[0];
    const handCard = makeCard('5', 'spades');
    const tableCard = makeCard('3', 'hearts');

    const testState = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, hand: [handCard] } : p
      ),
      table: [tableCard],
    };

    const { error } = applyAction(
      { type: 'capture', handCard, targets: [tableCard] },
      testState
    );
    expect(error).not.toBeNull();
  });
});

describe('trail action', () => {
  test('trail adds card to table', () => {
    const state = createGame(['Alice', 'Bob']);
    const handCard = state.players[0].hand[0];
    const tableSize = state.table.length;

    const { state: newState, error } = applyAction(
      { type: 'trail', handCard },
      state
    );
    expect(error).toBeNull();
    expect(newState.table.length).toBe(tableSize + 1);
  });
});

describe('scoring', () => {
  test('most cards earns 3 points', () => {
    const p1: Player = { id: 'p1', name: 'Alice', hand: [], isAI: false, captured: Array(28).fill(makeCard('2', 'hearts')) };
    const p2: Player = { id: 'p2', name: 'Bob', hand: [], isAI: true, captured: Array(24).fill(makeCard('3', 'clubs')) };
    const scores = scoreRound([p1, p2], null);
    expect(scores.find(s => s.playerId === 'p1')!.points).toBeGreaterThanOrEqual(3);
  });

  test('big casino awards 2 points', () => {
    const p1: Player = { id: 'p1', name: 'Alice', hand: [], isAI: false, captured: [makeCard('10', 'diamonds')] };
    const p2: Player = { id: 'p2', name: 'Bob', hand: [], isAI: true, captured: [] };
    const scores = scoreRound([p1, p2], null);
    expect(scores.find(s => s.playerId === 'p1')!.bigCasino).toBe(true);
    expect(scores.find(s => s.playerId === 'p1')!.points).toBeGreaterThanOrEqual(2);
  });
});
