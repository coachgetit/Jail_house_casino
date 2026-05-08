import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import type { Card, TableEntity } from '@casino/core';

interface Props {
  selectedHandCard: Card | null;
  selectedTargets: TableEntity[];
  onCapture: () => void;
  onBuild: (value: number) => void;
  onTrail: () => void;
  error: string | null;
  disabled: boolean;
}

export function ActionPanel({ selectedHandCard, selectedTargets, onCapture, onBuild, onTrail, error, disabled }: Props) {
  const [buildValue, setBuildValue] = useState('');

  const hasHand = !!selectedHandCard;
  const hasTargets = selectedTargets.length > 0;
  const canCapture = !disabled && hasHand && hasTargets;
  const canBuild = !disabled && hasHand && hasTargets && buildValue !== '';
  const canTrail = !disabled && hasHand;

  const handleBuild = () => {
    const v = parseInt(buildValue);
    if (!isNaN(v)) { onBuild(v); setBuildValue(''); }
  };

  return (
    <View style={styles.container}>
      {selectedHandCard && (
        <Text style={styles.selection}>
          {'Selected: '}
          <Text style={styles.bold}>{selectedHandCard.rank} of {selectedHandCard.suit}</Text>
          {hasTargets ? `  +  ${selectedTargets.length} table card(s)` : ''}
        </Text>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: canCapture ? '#16a34a' : '#334155' }]}
          onPress={canCapture ? onCapture : undefined}
          activeOpacity={canCapture ? 0.7 : 1}
        >
          <Text style={[styles.btnText, { color: canCapture ? '#fff' : '#64748b' }]}>Capture</Text>
        </TouchableOpacity>

        <View style={styles.buildRow}>
          <TextInput
            style={styles.input}
            placeholder="Val"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            value={buildValue}
            onChangeText={setBuildValue}
            maxLength={2}
          />
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: canBuild ? '#6366f1' : '#334155' }]}
            onPress={canBuild ? handleBuild : undefined}
            activeOpacity={canBuild ? 0.7 : 1}
          >
            <Text style={[styles.btnText, { color: canBuild ? '#fff' : '#64748b' }]}>Build</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: canTrail ? '#b45309' : '#334155' }]}
          onPress={canTrail ? onTrail : undefined}
          activeOpacity={canTrail ? 0.7 : 1}
        >
          <Text style={[styles.btnText, { color: canTrail ? '#fff' : '#64748b' }]}>Trail</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  selection: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
  },
  bold: { fontWeight: '700' },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  buildRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  input: {
    width: 52,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    fontSize: 14,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#450a0a',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
});
