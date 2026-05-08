import type { Stack } from '@casino/core';
import { CardView } from './CardView';

interface Props {
  stack: Stack;
  selected?: boolean;
  onClick?: () => void;
  ownerName: string;
}

export function StackView({ stack, selected, onClick, ownerName }: Props) {
  const cls = [
    'stack-view',
    onClick  ? 'stack-view--clickable' : '',
    selected ? 'stack-view--selected'  : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} onClick={onClick}>
      <div className="stack-cards">
        {stack.cards.map(c => (
          <CardView key={c.id} card={c} small />
        ))}
      </div>
      <span className="stack-label">Stack {stack.rank} ({ownerName})</span>
    </div>
  );
}
