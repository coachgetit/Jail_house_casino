import type { TableEntity, Card, Build, Stack } from '@casino/core';
import { isCard, isBuild } from '@casino/core';
import { CardView } from './CardView';
import { BuildView } from './BuildView';
import { StackView } from './StackView';
import { useCosmetics } from '../contexts/CosmeticsContext';

interface Props {
  table: TableEntity[];
  selectedTargets: TableEntity[];
  onToggle: (e: TableEntity) => void;
  playerNames: Record<string, string>;
  disabled: boolean;
}

function entityId(e: TableEntity) {
  return e.id;
}

export function TableArea({ table, selectedTargets, onToggle, playerNames, disabled }: Props) {
  const selectedIds = new Set(selectedTargets.map(entityId));
  const { feltStyle } = useCosmetics();

  return (
    <div className="table-felt" style={{ background: feltStyle }}>
      {table.length === 0 && <span className="table-empty">Table is empty</span>}
      {table.map(entity => {
        const id = entityId(entity);
        const selected = selectedIds.has(id);
        const toggle = disabled ? undefined : () => onToggle(entity);

        if (isCard(entity)) {
          return <CardView key={id} card={entity as Card} selected={selected} onClick={toggle} />;
        }
        if (isBuild(entity)) {
          const build = entity as Build;
          return (
            <BuildView
              key={id}
              build={build}
              selected={selected}
              onClick={toggle}
              ownerName={playerNames[build.ownerId] ?? build.ownerId}
            />
          );
        }
        const stack = entity as Stack;
        return (
          <StackView
            key={id}
            stack={stack}
            selected={selected}
            onClick={toggle}
            ownerName={playerNames[stack.ownerId] ?? stack.ownerId}
          />
        );
      })}
    </div>
  );
}
