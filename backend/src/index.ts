import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import type { Food, Player } from './types';

// Redis setup
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: +(process.env.REDIS_PORT || 6379),
});
redis.on('error', (err) => console.error('🔴 Redis error:', err));

// Redis keys
const PLAYER_HASH = 'rlt:players';
const LEADERBOARD = 'rlt:leaderboard';
const FOOD_HASH = 'rlt:foods';

// On startup: clear old game state and initialize foods
async function resetGame() {
  await redis.del(PLAYER_HASH, LEADERBOARD, FOOD_HASH);
  console.log('[INIT] Cleared old game data');
  // seed 100 food items
  const multi = redis.multi();
  for (let i = 0; i < 100; i++) {
    const id = randomUUID();
    const food: Food = { id, x: rand(-500, 500), y: rand(-500, 500), size: 5 };
    multi.hset(FOOD_HASH, id, JSON.stringify(food));
  }
  await multi.exec();
  console.log('[INIT] Seeded 100 food items');
}

resetGame().catch(console.error);

// HTTP + Socket.IO
const httpServer = http.createServer();
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

// Util: random
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

io.on('connection', (socket) => {
  const nick = (socket.handshake.query.nick as string) || 'Anonymous';
  const id = socket.id;

  // Create and store new player
  const player: Player = {
    id,
    nick,
    x: 0,
    y: 0,
    size: 20,
    color: `hsl(${Math.random() * 360},70%,50%)`,
  };
  redis.hset(PLAYER_HASH, id, JSON.stringify(player));
  redis.zadd(LEADERBOARD, player.size, id);

  socket.on('move', async (dir: { x: number; y: number }) => {
    try {
      const data = await redis.hget(PLAYER_HASH, id);
      if (!data) return;
      const p: Player = JSON.parse(data);
      p.x = Math.max(-500, Math.min(500, p.x + dir.x * 5));
      p.y = Math.max(-500, Math.min(500, p.y + dir.y * 5));
      await redis.hset(PLAYER_HASH, id, JSON.stringify(p));
      await redis.zadd(LEADERBOARD, p.size, id);
    } catch (err) {
      console.error('[MOVE ERROR]', err);
    }
  });

  socket.on('disconnect', async () => {
    await redis.hdel(PLAYER_HASH, id);
    await redis.zrem(LEADERBOARD, id);
  });
});

const TICK_RATE_MS = 1000;
setInterval(async () => {
  try {
    // Fetch all players & foods
    const [rawPlayers, rawFoods] = await Promise.all([
      redis.hgetall(PLAYER_HASH),
      redis.hgetall(FOOD_HASH),
    ]);
    const players = Object.values(rawPlayers).map((item) =>
      JSON.parse(item)
    ) as Player[];
    const foods = Object.values(rawFoods).map((item) =>
      JSON.parse(item)
    ) as Food[];

    // Prepare batch
    const batch = redis.multi();
    let respawnCount = 0;
    const MAX_FOODS = 100;

    // Collisions & updates
    for (let i = 0; i < players.length; i++) {
      const a = players[i];
      // player-player collisions
      for (let j = i + 1; j < players.length; j++) {
        const b = players[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < a.size && a.size > b.size * 1.1) {
          a.size += b.size * 0.2;
          batch.hdel(PLAYER_HASH, b.id).zrem(LEADERBOARD, b.id);
        } else if (d < b.size && b.size > a.size * 1.1) {
          b.size += a.size * 0.2;
          batch.hdel(PLAYER_HASH, a.id).zrem(LEADERBOARD, a.id);
        }
      }
      for (const f of foods) {
        const d = Math.hypot(a.x - f.x, a.y - f.y);
        if (d < a.size) {
          a.size += f.size * 0.5;
          batch.hdel(FOOD_HASH, f.id);
          // only respawn if under limit
          if (foods.length - respawnCount < MAX_FOODS) {
            const newId = randomUUID();
            const nf: Food = {
              id: newId,
              x: rand(-500, 500),
              y: rand(-500, 500),
              size: 5,
            };
            batch.hset(FOOD_HASH, newId, JSON.stringify(nf));
            respawnCount++;
          }
        }
      }
      batch.hset(PLAYER_HASH, a.id, JSON.stringify(a));
      batch.zadd(LEADERBOARD, a.size, a.id);
    }

    // Exec batch
    await batch.exec();

    // Leaders (only real players)
    const top = await redis.zrevrange(
      LEADERBOARD,
      0,
      players.length - 1,
      'WITHSCORES'
    );
    const leaders = [] as { id: string; size: number }[];
    for (let i = 0; i < top.length; i += 2) {
      leaders.push({ id: top[i], size: parseFloat(top[i + 1]) });
    }

    // Emit state
    io.emit('state', { players, foods, leaders });
  } catch (err) {
    console.error('[BROADCAST ERROR]', err);
  }
}, TICK_RATE_MS);

// Start server
const PORT = +(process.env.PORT || 3001);
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
