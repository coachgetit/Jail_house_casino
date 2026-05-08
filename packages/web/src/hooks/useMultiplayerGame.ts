import { useState, useEffect, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState, Action, Card, TableEntity } from '@casino/core';
import { getWinner } from '@casino/core';

export function useMultiplayerGame(socket: Socket) {
  const [state, setState] = useState<GameState | null>(null);
  const [yourIndex, setYourIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<TableEntity[]>([]);

  useEffect(() => {
    function onGameStarted({ state: s, yourIndex: idx }: { state: GameState; yourIndex: number }) {
      setState(s);
      setYourIndex(idx);
    }
    function onGameState({ state: s }: { state: GameState }) {
      setState(s);
      setSelectedHandCard(null);
      setSelectedTargets([]);
      setError(null);
    }
    function onError({ message }: { message: string }) {
      setError(message);
    }

    socket.on('game-started', onGameStarted);
    socket.on('game-state', onGameState);
    socket.on('opponent-disconnected', () => setOpponentLeft(true));
    socket.on('mp-error', onError);

    return () => {
      socket.off('game-started', onGameStarted);
      socket.off('game-state', onGameState);
      socket.off('opponent-disconnected');
      socket.off('mp-error', onError);
    };
  }, [socket]);

  const dispatch = useCallback((action: Action) => {
    setError(null);
    socket.emit('game-action', { action });
    setSelectedHandCard(null);
    setSelectedTargets([]);
  }, [socket]);

  const toggleTarget = useCallback((entity: TableEntity) => {
    setSelectedTargets(prev => {
      const exists = prev.some(e => e.id === entity.id);
      return exists ? prev.filter(e => e.id !== entity.id) : [...prev, entity];
    });
  }, []);

  const capture = useCallback(() => {
    if (!selectedHandCard) return;
    dispatch({ type: 'capture', handCard: selectedHandCard, targets: selectedTargets });
  }, [selectedHandCard, selectedTargets, dispatch]);

  const build = useCallback((declaredValue: number) => {
    if (!selectedHandCard) return;
    const tableCards = selectedTargets.filter((e): e is Card => 'suit' in e);
    dispatch({ type: 'build', handCard: selectedHandCard, targets: tableCards, declaredValue });
  }, [selectedHandCard, selectedTargets, dispatch]);

  const trail = useCallback(() => {
    if (!selectedHandCard) return;
    dispatch({ type: 'trail', handCard: selectedHandCard });
  }, [selectedHandCard, dispatch]);

  const nextRound = useCallback(() => socket.emit('next-round'), [socket]);

  const me = state ? state.players[yourIndex] : null;
  const opponent = state ? state.players[1 - yourIndex] : null;
  const isMyTurn = state
    ? state.currentPlayerIndex === yourIndex && !state.roundOver && !state.gameOver
    : false;
  const winner = state ? getWinner(state) : null;

  return {
    state, yourIndex, error, opponentLeft,
    selectedHandCard, selectedTargets,
    setSelectedHandCard, toggleTarget,
    capture, build, trail, nextRound,
    isMyTurn, me, opponent, winner,
  };
}
