import type { Build } from '@casino/core';
import { CardView } from './CardView';

interface Props {
  build: Build;
  selected?: boolean;
  onClick?: () => void;
  ownerName: string;
}

export function BuildView({ build, selected, onClick, ownerName }: Props) {
  const cls = [
    'build-view',
    onClick  ? 'build-view--clickable' : '',
    selected ? 'build-view--selected'  : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} onClick={onClick}>
      <div className="build-cards">
        {build.cards.map(c => (
          <CardView key={c.id} card={c} small />
        ))}
      </div>
      <span className="build-label">Build {build.value} ({ownerName})</span>
    </div>
  );
}
