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

const PLAYER_HASH = 'rlt:players';
const LEADERBOARD = 'rlt:leaderboard';
const FOOD_HASH = 'rlt:foods';
const TICK_RATE_MS = 1000;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

(async () => {
  await redis.del(PLAYER_HASH, LEADERBOARD, FOOD_HASH);
  const m = redis.multi();
  for (let i = 0; i < 100; i++) {
    const id = randomUUID();
    m.hset(
      FOOD_HASH,
      id,
      JSON.stringify({ id, x: rand(-500, 500), y: rand(-500, 500), size: 5 })
    );
  }
  await m.exec();
})().catch(console.error);

const httpServer = http.createServer();
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  const id = socket.id;
  const nick = (socket.handshake.query.nick as string) || 'Anonymous';

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

  socket.on('move', async (dir) => {
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

setInterval(async () => {
  try {
    const [rawP, rawF] = await Promise.all([
      redis.hgetall(PLAYER_HASH),
      redis.hgetall(FOOD_HASH),
    ]);
    let players = Object.values(rawP).map((item) =>
      JSON.parse(item)
    ) as Player[];
    const foods = Object.values(rawF).map((item) => JSON.parse(item)) as Food[];

    const toRemove = new Set<string>();
    const respawnOps = [] as { id: string; data: string }[];
    const MAX_FOODS = 100;
    const batch = redis.multi();

    // Player-player
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const a = players[i],
          b = players[j];
        if (toRemove.has(a.id) || toRemove.has(b.id)) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < a.size && a.size > b.size * 1.1) {
          a.size += b.size * 0.2;
          toRemove.add(b.id);
        } else if (d < b.size && b.size > a.size * 1.1) {
          b.size += a.size * 0.2;
          toRemove.add(a.id);
        }
      }
    }
    players = players.filter((p) => !toRemove.has(p.id));
    toRemove.forEach((id) => batch.hdel(PLAYER_HASH, id).zrem(LEADERBOARD, id));

    let currentFoodCount = foods.length;
    for (const p of players) {
      for (const f of foods) {
        const d = Math.hypot(p.x - f.x, p.y - f.y);
        if (d < p.size) {
          p.size += f.size * 0.5;
          batch.hdel(FOOD_HASH, f.id);
          currentFoodCount--;
          if (currentFoodCount < MAX_FOODS) {
            const idNew = randomUUID();
            const nf = {
              id: idNew,
              x: rand(-500, 500),
              y: rand(-500, 500),
              size: 5,
            };
            respawnOps.push({ id: idNew, data: JSON.stringify(nf) });
            currentFoodCount++;
          }
        }
      }
    }
    respawnOps.forEach((o) => batch.hset(FOOD_HASH, o.id, o.data));

    players.forEach((p) =>
      batch
        .hset(PLAYER_HASH, p.id, JSON.stringify(p))
        .zadd(LEADERBOARD, p.size, p.id)
    );
    await batch.exec();

    // Leaders
    const top = await redis.zrevrange(
      LEADERBOARD,
      0,
      players.length - 1,
      'WITHSCORES'
    );
    const leaders: { id: string; size: number }[] = [];
    for (let i = 0; i < top.length; i += 2)
      leaders.push({ id: top[i], size: parseFloat(top[i + 1]) });

    io.emit('state', { players, foods, leaders });
  } catch (err) {
    console.error('[BROADCAST ERROR]', err);
  }
}, TICK_RATE_MS / 60);

const PORT = +(process.env.PORT || 3001);
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
