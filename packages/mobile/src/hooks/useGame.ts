import { useState, useCallback } from 'react';
import type { GameState, Action, Card, TableEntity } from '@casino/core';
import { createGame, applyAction, startNewRound, getWinner, aiChooseAction } from '@casino/core';

export function useGame(playerName: string) {
  const [state, setState] = useState<GameState>(() => createGame([playerName, 'AI']));
  const [error, setError] = useState<string | null>(null);
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<TableEntity[]>([]);

  const dispatch = useCallback((action: Action) => {
    setState(prev => {
      const { state: next, error: err } = applyAction(action, prev);
      if (err) { setError(err); return prev; }
      setError(null);

      let s = next;
      while (!s.roundOver && !s.gameOver && s.players[s.currentPlayerIndex].isAI) {
        const aiAction = aiChooseAction(s);
        const { state: afterAI } = applyAction(aiAction, s);
        s = afterAI;
      }
      return s;
    });
    setSelectedHandCard(null);
    setSelectedTargets([]);
  }, []);

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

  const newRound = useCallback(() => {
    setState(prev => startNewRound(prev));
    setSelectedHandCard(null);
    setSelectedTargets([]);
    setError(null);
  }, []);

  const newGame = useCallback(() => {
    setState(createGame([playerName, 'AI']));
    setSelectedHandCard(null);
    setSelectedTargets([]);
    setError(null);
  }, [playerName]);

  const winner = getWinner(state);
  const humanPlayer = state.players[0];
  const aiPlayer = state.players[1];
  const isHumanTurn = state.currentPlayerIndex === 0 && !state.roundOver && !state.gameOver;

  return {
    state, error, selectedHandCard, selectedTargets,
    setSelectedHandCard, toggleTarget,
    capture, build, trail, newRound, newGame,
    winner, humanPlayer, aiPlayer, isHumanTurn,
  };
}
