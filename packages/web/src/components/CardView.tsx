import type { Card } from '@casino/core';
import { useCosmetics } from '../contexts/CosmeticsContext';

interface Props {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  small?: boolean;
}

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

const RED_SUITS = new Set(['hearts', 'diamonds']);

export function CardView({ card, selected, onClick, faceDown, small }: Props) {
  const { cardBackStyle } = useCosmetics();
  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];

  const cls = [
    'card',
    small ? 'card--small' : 'card--normal',
    faceDown ? 'card--face-down' : (isRed ? 'card--red' : 'card--black'),
    selected  ? 'card--selected'  : '',
    onClick   ? 'card--clickable' : '',
  ].filter(Boolean).join(' ');

  if (faceDown) return <div className={cls} style={{ background: cardBackStyle }} onClick={onClick} />;

  return (
    <div className={cls} onClick={onClick}>
      <div className="card-corner">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-sm">{symbol}</span>
      </div>
      <span className="card-center">{symbol}</span>
      <div className="card-corner card-corner--bottom">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-sm">{symbol}</span>
      </div>
    </div>
  );
}
