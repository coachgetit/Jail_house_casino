import { useState, useRef } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useGame } from './src/hooks/useGame';
import { useMultiplayerGame } from './src/hooks/useMultiplayerGame';
import { HandArea } from './src/components/HandArea';
import { TableArea } from './src/components/TableArea';
import { ActionPanel } from './src/components/ActionPanel';
import { ScoreBoard } from './src/components/ScoreBoard';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

type Screen = 'lobby' | 'solo-game' | 'multi-menu' | 'waiting-room' | 'queued' | 'multi-game';

function Game({ playerName, onLeave }: { playerName: string; onLeave: () => void }) {
  const {
    state, error,
    selectedHandCard, selectedTargets,
    setSelectedHandCard, toggleTarget,
    capture, build, trail, newRound,
    winner, humanPlayer, aiPlayer, isHumanTurn,
  } = useGame(playerName);

  const playerNames: Record<string, string> = {
    [humanPlayer.id]: humanPlayer.name,
    [aiPlayer.id]: aiPlayer.name,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.game} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>♠ CASINO ♦</Text>

        <ScoreBoard state={state} players={[humanPlayer, aiPlayer]} />

        <HandArea
          cards={aiPlayer.hand}
          selectedCard={null}
          onSelect={() => {}}
          label={aiPlayer.name}
          isAI
        />

        <TableArea
          table={state.table}
          selectedTargets={selectedTargets}
          onToggle={toggleTarget}
          playerNames={playerNames}
          disabled={!isHumanTurn}
        />

        <HandArea
          cards={humanPlayer.hand}
          selectedCard={selectedHandCard}
          onSelect={setSelectedHandCard}
          label={`${humanPlayer.name} (you)`}
        />

        {!state.roundOver && !state.gameOver && (
          <ActionPanel
            selectedHandCard={selectedHandCard}
            selectedTargets={selectedTargets}
            onCapture={capture}
            onBuild={build}
            onTrail={trail}
            error={error}
            disabled={!isHumanTurn}
          />
        )}

        {!isHumanTurn && !state.roundOver && !state.gameOver && (
          <Text style={styles.aiThinking}>AI is thinking...</Text>
        )}

        {state.roundOver && !state.gameOver && (
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Round Over</Text>
            <Text style={styles.modalSub}>Scores updated. Ready for the next round?</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#16a34a' }]} onPress={newRound} activeOpacity={0.7}>
              <Text style={styles.modalBtnText}>Next Round</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.gameOver && (
          <View style={styles.modal}>
            {state.bonusPayout && (
              <Text style={styles.bonusBanner}>🎉 Perfect Hand — 2× Payout!</Text>
            )}
            <Text style={[styles.modalTitle, styles.gameOverTitle]}>
              {winner?.id === humanPlayer.id ? '🏆 You Win!' : '💀 AI Wins!'}
            </Text>
            <Text style={styles.modalSub}>{winner?.name} reached {state.targetScore} points.</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6366f1' }]} onPress={onLeave} activeOpacity={0.7}>
              <Text style={styles.modalBtnText}>Back to Lobby</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MultiplayerGame({
  socket, onLeave,
}: {
  socket: Socket;
  onLeave: () => void;
}) {
  const {
    state, error, opponentLeft,
    selectedHandCard, selectedTargets,
    setSelectedHandCard, toggleTarget,
    capture, build, trail, nextRound,
    isMyTurn, me, opponent, winner,
  } = useMultiplayerGame(socket);

  if (!state || !me || !opponent) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={[styles.game, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.aiThinking}>Connecting…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (opponentLeft) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <View style={[styles.game, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Opponent Disconnected</Text>
            <Text style={styles.modalSub}>Your opponent left the game.</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6366f1' }]} onPress={onLeave} activeOpacity={0.7}>
              <Text style={styles.modalBtnText}>Back to Lobby</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const playerNames: Record<string, string> = {
    [me.id]: me.name,
    [opponent.id]: opponent.name,
  };
  const iWon = winner?.id === me.id;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.game} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>♠ CASINO ♦</Text>

        <ScoreBoard state={state} players={[me, opponent]} />

        <HandArea
          cards={opponent.hand}
          selectedCard={null}
          onSelect={() => {}}
          label={opponent.name}
          isAI
        />

        <TableArea
          table={state.table}
          selectedTargets={selectedTargets}
          onToggle={toggleTarget}
          playerNames={playerNames}
          disabled={!isMyTurn}
        />

        <HandArea
          cards={me.hand}
          selectedCard={selectedHandCard}
          onSelect={setSelectedHandCard}
          label={`${me.name} (you)`}
        />

        {!state.roundOver && !state.gameOver && (
          <ActionPanel
            selectedHandCard={selectedHandCard}
            selectedTargets={selectedTargets}
            onCapture={capture}
            onBuild={build}
            onTrail={trail}
            error={error}
            disabled={!isMyTurn}
          />
        )}

        {!isMyTurn && !state.roundOver && !state.gameOver && (
          <Text style={styles.aiThinking}>Waiting for {opponent.name}…</Text>
        )}

        {state.roundOver && !state.gameOver && (
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Round Over</Text>
            <Text style={styles.modalSub}>Scores updated. Ready for the next round?</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#16a34a' }]} onPress={nextRound} activeOpacity={0.7}>
              <Text style={styles.modalBtnText}>Next Round</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.gameOver && (
          <View style={styles.modal}>
            {state.bonusPayout && (
              <Text style={styles.bonusBanner}>🎉 Perfect Hand — 2× Payout!</Text>
            )}
            <Text style={[styles.modalTitle, iWon ? styles.winTitle : styles.loseTitle]}>
              {iWon ? '🏆 You Win!' : `${winner?.name} Wins!`}
            </Text>
            <Text style={styles.modalSub}>{winner?.name} reached {state.targetScore} points.</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6366f1' }]} onPress={onLeave} activeOpacity={0.7}>
              <Text style={styles.modalBtnText}>Back to Lobby</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [screen, setScreen] = useState<Screen>('lobby');
  const socketRef = useRef<Socket | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');

  const canStart = playerName.trim().length > 0;

  function openMultiMenu() {
    const s = io(BACKEND_URL, { autoConnect: false });
    s.connect();
    socketRef.current = s;

    s.once('room-created', ({ code }: { code: string }) => {
      setRoomCode(code);
      setScreen('waiting-room');
    });
    s.once('game-started', () => setScreen('multi-game'));
    s.on('queued', () => setScreen('queued'));

    setScreen('multi-menu');
  }

  function handleLeaveMulti() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setRoomCode('');
    setJoinInput('');
    setScreen('lobby');
  }

  function handleCreateRoom() {
    socketRef.current?.emit('create-room', { name: playerName.trim() });
  }

  function handleFindMatch() {
    socketRef.current?.emit('find-match', { name: playerName.trim() });
  }

  function handleCancelFind() {
    socketRef.current?.emit('cancel-find');
    setScreen('multi-menu');
  }

  function handleJoinRoom() {
    const code = joinInput.trim().toUpperCase();
    if (!code) return;
    socketRef.current?.once('game-started', () => setScreen('multi-game'));
    socketRef.current?.emit('join-room', { code, name: playerName.trim() });
  }

  if (screen === 'solo-game') {
    return <Game playerName={playerName.trim()} onLeave={() => setScreen('lobby')} />;
  }

  if (screen === 'multi-game' && socketRef.current) {
    return <MultiplayerGame socket={socketRef.current} onLeave={handleLeaveMulti} />;
  }

  if (screen === 'waiting-room') {
    return (
      <View style={styles.welcome}>
        <StatusBar style="light" />
        <Text style={styles.welcomeTitle}>♠ CASINO ♦</Text>
        <Text style={styles.welcomeSub}>Share this code with your opponent</Text>
        <Text style={styles.codeDisplay}>{roomCode}</Text>
        <Text style={styles.welcomeSub}>Waiting for opponent to join…</Text>
        <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#dc2626', marginTop: 16 }]} onPress={handleLeaveMulti} activeOpacity={0.7}>
          <Text style={styles.playBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'queued') {
    return (
      <View style={styles.welcome}>
        <StatusBar style="light" />
        <Text style={styles.welcomeTitle}>♠ CASINO ♦</Text>
        <Text style={styles.welcomeSub}>Finding an opponent…</Text>
        <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#dc2626', marginTop: 16 }]} onPress={handleCancelFind} activeOpacity={0.7}>
          <Text style={styles.playBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'multi-menu') {
    return (
      <KeyboardAvoidingView
        style={styles.welcome}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        <Text style={styles.welcomeTitle}>♠ CASINO ♦</Text>
        <Text style={styles.welcomeSub}>Play vs another player</Text>
        <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#16a34a' }]} onPress={handleCreateRoom} activeOpacity={0.7}>
          <Text style={styles.playBtnText}>Create Room</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#6366f1' }]} onPress={handleFindMatch} activeOpacity={0.7}>
          <Text style={styles.playBtnText}>Find Match</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8, width: '100%', maxWidth: 300 }}>
          <TextInput
            style={[styles.nameInput, { flex: 1, letterSpacing: 4 }]}
            placeholder="Room code"
            placeholderTextColor="#64748b"
            value={joinInput}
            onChangeText={t => setJoinInput(t.toUpperCase())}
            onSubmitEditing={handleJoinRoom}
            autoCapitalize="characters"
            maxLength={6}
            returnKeyType="go"
          />
          <TouchableOpacity
            style={[styles.playBtn, { marginTop: 0, backgroundColor: joinInput.trim() ? '#d97706' : '#334155', paddingHorizontal: 16 }]}
            onPress={handleJoinRoom}
            disabled={!joinInput.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.playBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.playBtn, styles.playBtnDisabled]}
          onPress={() => { socketRef.current?.disconnect(); socketRef.current = null; setScreen('lobby'); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.playBtnText, styles.playBtnTextDisabled]}>← Back</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  // Lobby
  return (
    <KeyboardAvoidingView
      style={styles.welcome}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <Text style={styles.welcomeTitle}>♠ CASINO ♦</Text>
      <Text style={styles.welcomeSub}>The classic fishing card game</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Enter your name"
        placeholderTextColor="#64748b"
        value={playerName}
        onChangeText={setPlayerName}
        onSubmitEditing={() => canStart && setScreen('solo-game')}
        returnKeyType="go"
        autoFocus
      />
      <TouchableOpacity
        style={[styles.playBtn, !canStart && styles.playBtnDisabled]}
        onPress={() => canStart && setScreen('solo-game')}
        activeOpacity={canStart ? 0.7 : 1}
      >
        <Text style={[styles.playBtnText, !canStart && styles.playBtnTextDisabled]}>vs AI</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.playBtn, !canStart ? styles.playBtnDisabled : { backgroundColor: '#6366f1' }]}
        onPress={() => canStart && openMultiMenu()}
        activeOpacity={canStart ? 0.7 : 1}
      >
        <Text style={[styles.playBtnText, !canStart && styles.playBtnTextDisabled]}>vs Player</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  game: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  title: {
    textAlign: 'center',
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
  },
  aiThinking: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
  },
  gameOverTitle: {
    color: '#fbbf24',
    fontSize: 28,
  },
  modalSub: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 4,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  welcome: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  welcomeTitle: {
    color: '#f1f5f9',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 4,
  },
  welcomeSub: {
    color: '#64748b',
    fontSize: 16,
  },
  nameInput: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    fontSize: 16,
    textAlign: 'center',
  },
  playBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    backgroundColor: '#16a34a',
  },
  playBtnDisabled: {
    backgroundColor: '#334155',
  },
  playBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  playBtnTextDisabled: {
    color: '#64748b',
  },
  winTitle: {
    color: '#fbbf24',
    fontSize: 28,
  },
  loseTitle: {
    color: '#ef4444',
    fontSize: 28,
  },
  bonusBanner: {
    color: '#fbbf24',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  codeDisplay: {
    color: '#fbbf24',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 10,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
