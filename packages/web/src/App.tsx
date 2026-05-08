import { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import './App.css';
import { useGame } from './hooks/useGame';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { HandArea } from './components/HandArea';
import { TableArea } from './components/TableArea';
import { ActionPanel } from './components/ActionPanel';
import { ScoreBoard } from './components/ScoreBoard';
import { Shop } from './components/Shop';
import { CosmeticsProvider, useCosmetics } from './contexts/CosmeticsContext';
import { connectSocket, disconnectSocket } from './socket';

/** Center-crop and compress an image file to a small JPEG data URL. */
function compressAvatar(file: File, size = 200): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const side = Math.min(img.width, img.height);
      const sx = (img.width  - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

function Game({
  playerName, bet, tokens, avatar, onGameOver, onPlayAgain, onOpenShop,
}: {
  playerName: string;
  bet: number;
  tokens: number;
  avatar: string | null;
  onGameOver: (humanWon: boolean, bonusPayout: boolean) => void;
  onPlayAgain: () => void;
  onOpenShop: () => void;
}) {
  const {
    state, error,
    selectedHandCard, selectedTargets,
    setSelectedHandCard, toggleTarget,
    capture, build, trail, newRound,
    winner, humanPlayer, aiPlayer, isHumanTurn,
  } = useGame(playerName);
  const { frameStyle } = useCosmetics();

  const reported = useRef(false);
  useEffect(() => {
    if (state.gameOver && !reported.current) {
      reported.current = true;
      onGameOver(winner?.id === humanPlayer.id, state.bonusPayout);
    }
  }, [state.gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const playerNames: Record<string, string> = {
    [humanPlayer.id]: humanPlayer.name,
    [aiPlayer.id]: aiPlayer.name,
  };

  const avatars: Record<string, string> = {};
  if (avatar) avatars[humanPlayer.id] = avatar;

  const humanWon = winner?.id === humanPlayer.id;

  return (
    <div className="game-wrapper">
      <h1 className="game-title">♠ CASINO ♦</h1>

      <div className="wager-banner">
        {avatar && <img src={avatar} alt="" className="avatar avatar--sm" style={{ width: 28, height: 28, border: frameStyle }} />}
        <span className="wager-stat">🪙 <strong>{tokens}</strong> tokens</span>
        <span className="wager-sep">·</span>
        <span className="wager-stat">Bet: <strong>{bet}</strong></span>
        <button className="btn btn-amber btn-sm shop-btn" onClick={onOpenShop}>🛒 Shop</button>
      </div>

      <ScoreBoard state={state} players={[humanPlayer, aiPlayer]} avatars={avatars} />

      <HandArea cards={aiPlayer.hand} selectedCard={null} onSelect={() => {}} label={aiPlayer.name} isAI />

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
        <p className="ai-thinking">AI is thinking…</p>
      )}

      {state.roundOver && !state.gameOver && (
        <div className="status-panel">
          <h2 className="status-title">Round Over</h2>
          <p className="status-subtitle">Scores updated. Ready for the next round?</p>
          <button className="btn btn-green" onClick={newRound}>Next Round</button>
        </div>
      )}

      {state.gameOver && (() => {
        const payout = state.bonusPayout ? bet * 2 : bet;
        return (
          <div className="status-panel">
            {avatar && <img src={avatar} alt="" className="avatar avatar--lg" style={{ border: frameStyle }} />}
            {state.bonusPayout && (
              <p className="bonus-banner">🎉 Perfect Hand — 2× Payout!</p>
            )}
            <h2 className={`status-title ${humanWon ? 'status-title--gold' : 'status-title--red'}`}>
              {humanWon ? '🏆 You Win!' : '💀 AI Wins!'}
            </h2>
            <p className={`token-delta ${humanWon ? 'token-delta--win' : 'token-delta--loss'}`}>
              {humanWon ? `+${payout}` : `-${payout}`} tokens
            </p>
            <p className="status-subtitle">{winner?.name} reached {state.targetScore} points.</p>
            <button className="btn btn-indigo" onClick={onPlayAgain}>Play Again</button>
          </div>
        );
      })()}
    </div>
  );
}

function MultiplayerGame({
  socket, bet, tokens, avatar, onGameOver, onLeave, onOpenShop,
}: {
  socket: Socket;
  bet: number;
  tokens: number;
  avatar: string | null;
  onGameOver: (iWon: boolean, bonusPayout: boolean) => void;
  onLeave: () => void;
  onOpenShop: () => void;
}) {
  const {
    state, error, opponentLeft,
    selectedHandCard, selectedTargets,
    setSelectedHandCard, toggleTarget,
    capture, build, trail, nextRound,
    isMyTurn, me, opponent, winner,
  } = useMultiplayerGame(socket);
  const { frameStyle } = useCosmetics();

  const reported = useRef(false);
  useEffect(() => {
    if (state?.gameOver && !reported.current) {
      reported.current = true;
      onGameOver(winner?.id === me?.id, state.bonusPayout);
    }
  }, [state?.gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || !me || !opponent) {
    return (
      <div className="game-wrapper">
        <h1 className="game-title">♠ CASINO ♦</h1>
        <p className="ai-thinking">Connecting…</p>
      </div>
    );
  }

  if (opponentLeft) {
    return (
      <div className="game-wrapper">
        <h1 className="game-title">♠ CASINO ♦</h1>
        <div className="status-panel">
          <h2 className="status-title status-title--red">Opponent Disconnected</h2>
          <p className="status-subtitle">Your opponent left the game.</p>
          <button className="btn btn-indigo" onClick={onLeave}>Back to Lobby</button>
        </div>
      </div>
    );
  }

  const playerNames: Record<string, string> = {
    [me.id]: me.name,
    [opponent.id]: opponent.name,
  };
  const avatars: Record<string, string> = {};
  if (avatar) avatars[me.id] = avatar;
  const iWon = winner?.id === me.id;

  return (
    <div className="game-wrapper">
      <h1 className="game-title">♠ CASINO ♦</h1>

      <div className="wager-banner">
        {avatar && <img src={avatar} alt="" className="avatar avatar--sm" style={{ width: 28, height: 28, border: frameStyle }} />}
        <span className="wager-stat">🪙 <strong>{tokens}</strong> tokens</span>
        <span className="wager-sep">·</span>
        <span className="wager-stat">Bet: <strong>{bet}</strong></span>
        <button className="btn btn-amber btn-sm shop-btn" onClick={onOpenShop}>🛒 Shop</button>
      </div>

      <ScoreBoard state={state} players={[me, opponent]} avatars={avatars} />

      <HandArea cards={opponent.hand} selectedCard={null} onSelect={() => {}} label={opponent.name} isAI />

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
        <p className="ai-thinking">Waiting for {opponent.name}…</p>
      )}

      {state.roundOver && !state.gameOver && (
        <div className="status-panel">
          <h2 className="status-title">Round Over</h2>
          <p className="status-subtitle">Scores updated. Ready for the next round?</p>
          <button className="btn btn-green" onClick={nextRound}>Next Round</button>
        </div>
      )}

      {state.gameOver && (() => {
        const payout = state.bonusPayout ? bet * 2 : bet;
        return (
          <div className="status-panel">
            {avatar && <img src={avatar} alt="" className="avatar avatar--lg" style={{ border: frameStyle }} />}
            {state.bonusPayout && (
              <p className="bonus-banner">🎉 Perfect Hand — 2× Payout!</p>
            )}
            <h2 className={`status-title ${iWon ? 'status-title--gold' : 'status-title--red'}`}>
              {iWon ? '🏆 You Win!' : `${winner?.name} Wins!`}
            </h2>
            <p className={`token-delta ${iWon ? 'token-delta--win' : 'token-delta--loss'}`}>
              {iWon ? `+${payout}` : `-${payout}`} tokens
            </p>
            <p className="status-subtitle">{winner?.name} reached {state.targetScore} points.</p>
            <button className="btn btn-indigo" onClick={onLeave}>Back to Lobby</button>
          </div>
        );
      })()}
    </div>
  );
}

type Screen = 'lobby' | 'solo-game' | 'multi-menu' | 'waiting-room' | 'queued' | 'multi-game';

function AppInner() {
  const [tokens, setTokens] = useState<number>(() =>
    parseInt(localStorage.getItem('casino-tokens') ?? '100', 10)
  );
  const [bet, setBet] = useState<number>(() =>
    Math.min(10, parseInt(localStorage.getItem('casino-tokens') ?? '100', 10))
  );
  const [avatar, setAvatar] = useState<string | null>(() =>
    localStorage.getItem('casino-avatar')
  );
  const [playerName, setPlayerName] = useState('');
  const [screen, setScreen] = useState<Screen>('lobby');
  const [shopOpen, setShopOpen] = useState(false);

  // Multiplayer state
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
  const [roomCode, setRoomCode] = useState('');       // code of room we created or joined
  const [joinInput, setJoinInput] = useState('');     // code typed by user to join

  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveBet = Math.min(bet, tokens);
  const isBroke = tokens === 0;
  const canPlay = playerName.trim().length > 0 && !isBroke;

  function saveTokens(n: number) { localStorage.setItem('casino-tokens', String(n)); }
  function handleEarnTokens(amount: number) {
    setTokens(prev => { const n = prev + amount; saveTokens(n); return n; });
  }
  function handleSpendTokens(amount: number) {
    setTokens(prev => { const n = Math.max(0, prev - amount); saveTokens(n); return n; });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressAvatar(file);
    setAvatar(compressed);
    localStorage.setItem('casino-avatar', compressed);
    e.target.value = '';
  }

  function handleGameOver(iWon: boolean, bonusPayout = false) {
    setTokens(prev => {
      const payout = bonusPayout ? effectiveBet * 2 : effectiveBet;
      const next = iWon ? prev + payout : Math.max(0, prev - payout);
      saveTokens(next);
      return next;
    });
  }

  function handleTopUp() { setTokens(100); setBet(10); saveTokens(100); }

  function handleBetChange(raw: string) {
    const v = parseInt(raw, 10);
    if (!isNaN(v)) setBet(Math.max(1, Math.min(tokens, v)));
  }

  // ── Multiplayer helpers ─────────────────────────────────────────────────────

  function openMultiMenu() {
    const s = connectSocket();
    socketRef.current = s;

    s.once('room-created', ({ code }: { code: string }) => {
      setRoomCode(code);
      setScreen('waiting-room');
    });
    s.once('game-started', () => setScreen('multi-game'));
    s.on('queued', () => setScreen('queued'));

    setScreen('multi-menu');
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

  function handleLeaveMulti() {
    disconnectSocket();
    socketRef.current = null;
    setRoomCode('');
    setJoinInput('');
    setScreen('lobby');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const shopOverlay = shopOpen && (
    <Shop
      tokens={tokens}
      onClose={() => setShopOpen(false)}
      onEarnTokens={handleEarnTokens}
      onSpendTokens={handleSpendTokens}
    />
  );

  if (screen === 'solo-game') {
    return (
      <>
        <div className="game-root">
          <Game
            playerName={playerName.trim()}
            bet={effectiveBet}
            tokens={tokens}
            avatar={avatar}
            onGameOver={handleGameOver}
            onPlayAgain={() => setScreen('lobby')}
            onOpenShop={() => setShopOpen(true)}
          />
        </div>
        {shopOverlay}
      </>
    );
  }

  if (screen === 'multi-game' && socketRef.current) {
    return (
      <>
        <div className="game-root">
          <MultiplayerGame
            socket={socketRef.current}
            bet={effectiveBet}
            tokens={tokens}
            avatar={avatar}
            onGameOver={handleGameOver}
            onLeave={handleLeaveMulti}
            onOpenShop={() => setShopOpen(true)}
          />
        </div>
        {shopOverlay}
      </>
    );
  }

  if (screen === 'waiting-room') {
    return (
      <div className="lobby">
        <div className="lobby-inner">
          <h1 className="casino-logo">♠ CASINO <span className="suit-red">♦</span></h1>
          <p className="casino-tagline">Share this code with your opponent</p>
          <div className="room-code">{roomCode}</div>
          <p className="status-subtitle">Waiting for opponent to join…</p>
          <button className="btn btn-wide btn-red" onClick={handleLeaveMulti}>Cancel</button>
        </div>
      </div>
    );
  }

  if (screen === 'queued') {
    return (
      <div className="lobby">
        <div className="lobby-inner">
          <h1 className="casino-logo">♠ CASINO <span className="suit-red">♦</span></h1>
          <p className="casino-tagline">Finding an opponent…</p>
          <div className="spinner" />
          <button className="btn btn-wide btn-red" onClick={handleCancelFind}>Cancel</button>
        </div>
      </div>
    );
  }

  if (screen === 'multi-menu') {
    return (
      <div className="lobby">
        <div className="lobby-inner">
          <h1 className="casino-logo">♠ CASINO <span className="suit-red">♦</span></h1>
          <p className="casino-tagline">Play vs another player</p>
          <div className="lobby-divider" />
          <button className="btn btn-wide btn-green" onClick={handleCreateRoom}>
            Create Room
          </button>
          <button className="btn btn-wide btn-indigo" onClick={handleFindMatch}>
            Find Match
          </button>
          <div className="lobby-divider" />
          <div className="join-row">
            <input
              type="text"
              placeholder="Room code"
              value={joinInput}
              onChange={e => setJoinInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
              className="name-input join-input"
              maxLength={6}
            />
            <button className="btn btn-amber" onClick={handleJoinRoom} disabled={!joinInput.trim()}>
              Join
            </button>
          </div>
          <button className="btn btn-wide btn-ghost" onClick={() => { disconnectSocket(); socketRef.current = null; setScreen('lobby'); }}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Lobby screen
  return (
    <>
      <div className="lobby">
        <div className="lobby-inner">
          <h1 className="casino-logo">
            ♠ CASINO <span className="suit-red">♦</span>
          </h1>
          <p className="casino-tagline">The classic fishing card game</p>

          <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
            {avatar
              ? <img src={avatar} alt="Your avatar" />
              : <span className="avatar-upload-icon">👤</span>
            }
            <div className="avatar-upload-overlay">{avatar ? 'Change' : 'Upload'}</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />

          <div className="token-balance">
            <span className="token-balance-icon">🪙</span>
            <span className="token-balance-value">{tokens}</span>
            <span className="token-balance-label">tokens</span>
          </div>

          <div className="lobby-divider" />

          {isBroke ? (
            <>
              <p className="bust-message">You're out of tokens!</p>
              <button className="btn btn-wide btn-green" onClick={handleTopUp}>
                Top Up — 100 tokens
              </button>
              <button className="btn btn-wide btn-amber" onClick={() => setShopOpen(true)}>
                🛒 Shop
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                className="name-input"
              />
              <div className="bet-row">
                <label className="bet-label">Bet</label>
                <input
                  type="number"
                  min={1}
                  max={tokens}
                  value={bet}
                  onChange={e => handleBetChange(e.target.value)}
                  className="bet-input"
                />
                <span className="bet-max" onClick={() => setBet(tokens)}>Max</span>
              </div>
              <button
                className={`btn btn-wide${canPlay ? ' btn-green' : ''}`}
                onClick={() => canPlay && setScreen('solo-game')}
                disabled={!canPlay}
              >
                vs AI
              </button>
              <button
                className={`btn btn-wide${canPlay ? ' btn-indigo' : ''}`}
                onClick={() => canPlay && openMultiMenu()}
                disabled={!canPlay}
              >
                vs Player
              </button>
              <button className="btn btn-wide btn-amber" onClick={() => setShopOpen(true)}>
                🛒 Shop
              </button>
            </>
          )}
        </div>
      </div>
      {shopOverlay}
    </>
  );
}

export default function App() {
  return (
    <CosmeticsProvider>
      <AppInner />
    </CosmeticsProvider>
  );
}
