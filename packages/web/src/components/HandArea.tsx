import type { Card } from '@casino/core';
import { CardView } from './CardView';

interface Props {
  cards: Card[];
  selectedCard: Card | null;
  onSelect: (c: Card) => void;
  label: string;
  isAI?: boolean;
}

export function HandArea({ cards, selectedCard, onSelect, label, isAI }: Props) {
  return (
    <div className="hand-area">
      <span className="hand-label">{label} — {cards.length} cards</span>
      <div className="hand-cards">
        {cards.map(card => (
          <CardView
            key={card.id}
            card={card}
            faceDown={isAI}
            selected={!isAI && selectedCard?.id === card.id}
            onClick={isAI ? undefined : () => onSelect(card)}
          />
        ))}
        {cards.length === 0 && <span className="hand-empty">No cards</span>}
      </div>
    </div>
  );
}
