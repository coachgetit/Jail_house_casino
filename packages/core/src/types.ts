export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g. "A-spades"
}

export interface Build {
  id: string;
  cards: Card[];
  value: number;
  ownerId: string; // player who owns the build
}

export type TableEntity = Card | Build;

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  captured: Card[];
  isAI: boolean;
}

export type ActionType = 'capture' | 'build' | 'trail';

export interface CaptureAction {
  type: 'capture';
  handCard: Card;
  targets: TableEntity[]; // cards/builds on table to capture
}

export interface BuildAction {
  type: 'build';
  handCard: Card;
  targets: Card[]; // table cards to combine with handCard
  declaredValue: number;
}

export interface TrailAction {
  type: 'trail';
  handCard: Card;
}

export type Action = CaptureAction | BuildAction | TrailAction;

export interface Score {
  playerId: string;
  cards: number;       // count of captured cards
  spades: number;      // count of captured spades
  aces: number;
  bigCasino: boolean;  // 10 of diamonds
  littleCasino: boolean; // 2 of spades
  points: number;      // total points this round
}

export interface GameState {
  players: Player[];
  table: TableEntity[];
  deck: Card[];
  currentPlayerIndex: number;
  dealerIndex: number;
  lastCapturePlayerId: string | null;
  roundOver: boolean;
  gameOver: boolean;
  scores: Record<string, number>; // cumulative points per player
  targetScore: number;
  roundNumber: number;
  bonusPayout: boolean; // true when one player sweeps all points in round 1
}
