import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Card } from '@casino/core';

interface Props {
  card: Card;
  selected?: boolean;
  onPress?: () => void;
  faceDown?: boolean;
  small?: boolean;
}

const SUIT_SYMBOL: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};
const RED_SUITS = new Set(['hearts', 'diamonds']);

export function CardView({ card, selected, onPress, faceDown, small }: Props) {
  const isRed = RED_SUITS.has(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];
  const w = small ? 44 : 56;
  const h = small ? 66 : 84;

  const cardStyle = [
    styles.card,
    { width: w, height: h },
    faceDown && styles.faceDown,
    selected && styles.selected,
  ];

  const content = faceDown ? null : (
    <>
      <Text style={[styles.rank, isRed && styles.red, small && styles.small]}>
        {card.rank}{symbol}
      </Text>
      <Text style={[styles.rankBottom, isRed && styles.red, small && styles.small]}>
        {card.rank}{symbol}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={cardStyle}>{content}</View>
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    padding: 4,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  faceDown: {
    backgroundColor: '#1e40af',
  },
  selected: {
    borderColor: '#f59e0b',
    transform: [{ translateY: -6 }],
  },
  rank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  rankBottom: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    transform: [{ rotate: '180deg' }],
    alignSelf: 'flex-end',
  },
  red: { color: '#dc2626' },
  small: { fontSize: 11 },
});
