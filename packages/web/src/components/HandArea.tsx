import type { Card } from '@casino/core';
import { CardView } from './CardView';

interface Props {
  cards: Card[];
  selectedCard: Card | null;
  onSelect: (c: Card) => void;
  label: string;
  isAI?: boolean;
  stackExtras?: Card[];
  onToggleStackExtra?: (c: Card) => void;
}

export function HandArea({ cards, selectedCard, onSelect, label, isAI, stackExtras, onToggleStackExtra }: Props) {
  const stackExtraIds = new Set((stackExtras ?? []).map(c => c.id));

  const handleClick = (card: Card) => {
    if (card.id === selectedCard?.id) {
      onSelect(card); // deselect
      return;
    }
    // If a hand card is already selected and this card matches rank → toggle as stack extra
    if (onToggleStackExtra && selectedCard && card.rank === selectedCard.rank) {
      onToggleStackExtra(card);
      return;
    }
    onSelect(card);
  };

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
            stackExtra={!isAI && stackExtraIds.has(card.id)}
            onClick={isAI ? undefined : () => handleClick(card)}
          />
        ))}
        {cards.length === 0 && <span className="hand-empty">No cards</span>}
      </div>
    </div>
  );
}
