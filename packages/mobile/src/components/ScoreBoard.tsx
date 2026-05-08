import { View, Text, StyleSheet } from 'react-native';
import type { Player, GameState } from '@casino/core';

interface Props {
  state: GameState;
  players: Player[];
}

export function ScoreBoard({ state, players }: Props) {
  return (
    <View style={styles.row}>
      {players.map((p, i) => {
        const isActive = state.currentPlayerIndex === i && !state.roundOver && !state.gameOver;
        return (
          <View key={p.id} style={[styles.card, isActive && styles.active]}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.score}>
              {state.scores[p.id] ?? 0}
              <Text style={styles.target}>/{state.targetScore}</Text>
            </Text>
            <Text style={styles.sub}>Captured: {p.captured.length}</Text>
          </View>
        );
      })}
      <View style={styles.card}>
        <Text style={styles.sub}>Deck</Text>
        <Text style={styles.score}>{state.deck.length}</Text>
        <Text style={styles.sub}>left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  active: { borderColor: '#f59e0b' },
  name: { color: '#f1f5f9', fontWeight: '700', fontSize: 12 },
  score: { color: '#fbbf24', fontSize: 22, fontWeight: '900' },
  target: { color: '#64748b', fontSize: 12, fontWeight: '400' },
  sub: { color: '#64748b', fontSize: 11 },
});
