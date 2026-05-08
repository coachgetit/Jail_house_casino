require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const Stripe = require('stripe');
const { createGame, applyAction, startNewRound } = require('@casino/core');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.ALLOWED_ORIGIN || '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

const TOKEN_PACKS = {
  starter:    { tokens: 100,  price: 99,   label: 'Starter Pack' },
  value:      { tokens: 500,  price: 399,  label: 'Value Pack' },
  highroller: { tokens: 1200, price: 799,  label: 'High Roller Pack' },
};

// Create a Stripe Checkout session for a token pack purchase
app.post('/create-checkout-session', async (req, res) => {
  const { packId, successUrl, cancelUrl } = req.body;
  const pack = TOKEN_PACKS[packId];
  if (!pack) return res.status(400).json({ error: 'Unknown pack' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Casino — ${pack.label}`, description: `${pack.tokens} tokens` },
          unit_amount: pack.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/success`,
      cancel_url:  cancelUrl  || `${process.env.FRONTEND_URL}/cancel`,
      metadata: { packId, tokens: String(pack.tokens) },
    });
    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Poll endpoint — frontend calls this every few seconds after redirect
app.get('/order-status/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      status: session.payment_status,   // 'paid' | 'unpaid' | 'no_payment_required'
      tokens: session.metadata?.tokens ? Number(session.metadata.tokens) : 0,
      packId: session.metadata?.packId ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Multiplayer ──────────────────────────────────────────────────────────────

/** @type {Map<string, { players: Array<{socketId:string,name:string}|null>, state: import('@casino/core').GameState|null }>} */
const rooms = new Map();
/** @type {Array<{socketId:string,name:string}>} */
const queue = [];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ name }) => {
    let code;
    do { code = generateCode(); } while (rooms.has(code));

    rooms.set(code, { players: [{ socketId: socket.id, name }, null], state: null });
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerIndex = 0;
    socket.emit('room-created', { code });
  });

  socket.on('join-room', ({ code, name }) => {
    const upper = (code || '').toUpperCase();
    const room = rooms.get(upper);
    if (!room) { socket.emit('mp-error', { message: 'Room not found' }); return; }
    if (room.players[1]) { socket.emit('mp-error', { message: 'Room is full' }); return; }

    room.players[1] = { socketId: socket.id, name };
    socket.join(upper);
    socket.data.roomCode = upper;
    socket.data.playerIndex = 1;

    const state = createGame([room.players[0].name, name], 21, { multiplayer: true });
    room.state = state;

    const p0 = io.sockets.sockets.get(room.players[0].socketId);
    if (p0) p0.emit('game-started', { state, yourIndex: 0 });
    socket.emit('game-started', { state, yourIndex: 1 });
  });

  socket.on('find-match', ({ name }) => {
    if (queue.length > 0) {
      const opponent = queue.shift();
      let code;
      do { code = generateCode(); } while (rooms.has(code));

      const state = createGame([opponent.name, name], 21, { multiplayer: true });
      rooms.set(code, { players: [opponent, { socketId: socket.id, name }], state });

      socket.join(code);
      socket.data.roomCode = code;
      socket.data.playerIndex = 1;

      const opSocket = io.sockets.sockets.get(opponent.socketId);
      if (opSocket) {
        opSocket.join(code);
        opSocket.data.roomCode = code;
        opSocket.emit('game-started', { state, yourIndex: 0 });
      }
      socket.emit('game-started', { state, yourIndex: 1 });
    } else {
      queue.push({ socketId: socket.id, name });
      socket.data.queuing = true;
      socket.emit('queued');
    }
  });

  socket.on('cancel-find', () => {
    const idx = queue.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) queue.splice(idx, 1);
    socket.data.queuing = false;
  });

  socket.on('game-action', ({ action }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room?.state) return;

    if (room.state.currentPlayerIndex !== socket.data.playerIndex) {
      socket.emit('mp-error', { message: 'Not your turn' });
      return;
    }

    const { state: next, error } = applyAction(action, room.state);
    if (error) { socket.emit('mp-error', { message: error }); return; }

    room.state = next;
    io.to(code).emit('game-state', { state: next });
  });

  socket.on('next-round', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room?.state) return;

    const next = startNewRound(room.state);
    room.state = next;
    io.to(code).emit('game-state', { state: next });
  });

  socket.on('disconnect', () => {
    const idx = queue.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) queue.splice(idx, 1);

    const code = socket.data.roomCode;
    if (code) {
      socket.to(code).emit('opponent-disconnected');
      rooms.delete(code);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Casino backend running on port ${PORT}`));
