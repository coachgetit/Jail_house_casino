import { View, Text, StyleSheet } from 'react-native';
import type { TableEntity, Card, Build } from '@casino/core';
import { CardView } from './CardView';
import { BuildView } from './BuildView';

interface Props {
  table: TableEntity[];
  selectedTargets: TableEntity[];
  onToggle: (e: TableEntity) => void;
  playerNames: Record<string, string>;
  disabled: boolean;
}

export function TableArea({ table, selectedTargets, onToggle, playerNames, disabled }: Props) {
  const selectedIds = new Set(selectedTargets.map(e => e.id));

  return (
    <View style={styles.table}>
      {table.length === 0 && <Text style={styles.empty}>Table is empty</Text>}
      <View style={styles.entities}>
        {table.map(entity => {
          const selected = selectedIds.has(entity.id);
          const onPress = disabled ? undefined : () => onToggle(entity);

          if ('suit' in entity) {
            return <CardView key={entity.id} card={entity as Card} selected={selected} onPress={onPress} />;
          }
          const build = entity as Build;
          return (
            <BuildView
              key={entity.id}
              build={build}
              selected={selected}
              onPress={onPress}
              ownerName={playerNames[build.ownerId] ?? build.ownerId}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    minHeight: 120,
    backgroundColor: '#14532d',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: '#86efac',
    opacity: 0.5,
  },
});
