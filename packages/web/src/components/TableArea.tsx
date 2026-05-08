import type { TableEntity, Card, Build } from '@casino/core';
import { CardView } from './CardView';
import { BuildView } from './BuildView';
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

        if ('suit' in entity) {
          return <CardView key={id} card={entity as Card} selected={selected} onClick={toggle} />;
        }
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
      })}
    </div>
  );
}
