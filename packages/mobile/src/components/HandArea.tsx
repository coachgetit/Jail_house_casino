import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.label}>{label} ({cards.length} cards)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {cards.length === 0
          ? <Text style={styles.empty}>No cards</Text>
          : cards.map(card => (
              <View key={card.id} style={styles.cardWrap}>
                <CardView
                  card={card}
                  faceDown={isAI}
                  selected={!isAI && selectedCard?.id === card.id}
                  onPress={isAI ? undefined : () => onSelect(card)}
                />
              </View>
            ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
  },
  scroll: {
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  cardWrap: {},
  empty: {
    color: '#475569',
    fontSize: 13,
    alignSelf: 'center',
  },
});
