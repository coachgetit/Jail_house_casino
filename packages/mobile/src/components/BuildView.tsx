import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Build } from '@casino/core';
import { CardView } from './CardView';

interface Props {
  build: Build;
  selected?: boolean;
  onPress?: () => void;
  ownerName: string;
}

export function BuildView({ build, selected, onPress, ownerName }: Props) {
  const inner = (
    <View style={[styles.container, selected && styles.selected]}>
      <View style={styles.cards}>
        {build.cards.map(c => <CardView key={c.id} card={c} small />)}
      </View>
      <Text style={styles.label}>Build {build.value} ({ownerName})</Text>
    </View>
  );

  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>
    : inner;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 10,
    padding: 4,
    backgroundColor: '#1e1b4b',
  },
  selected: {
    borderColor: '#f59e0b',
  },
  cards: {
    flexDirection: 'row',
    gap: 2,
  },
  label: {
    color: '#a5b4fc',
    fontSize: 11,
  },
});
