import { Card, Rank, Suit } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function cardValue(card: Card): number {
  if (card.rank === 'A') return 1;
  const n = parseInt(card.rank);
  if (!isNaN(n)) return n;
  return 0; // J, Q, K have no numeric value for building
}

export function isFaceCard(card: Card): boolean {
  return ['J', 'Q', 'K'].includes(card.rank);
}

export function createDeck(): Card[] {
  return SUITS.flatMap(suit =>
    RANKS.map(rank => ({ suit, rank, id: `${rank}-${suit}` }))
  );
}

export function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function isBigCasino(card: Card): boolean {
  return card.rank === '10' && card.suit === 'diamonds';
}

export function isLittleCasino(card: Card): boolean {
  return card.rank === '2' && card.suit === 'spades';
}
