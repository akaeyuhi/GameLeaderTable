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

const PLAYER_KEY = 'player';
const LEADERBOARD_KEY = 'leaderboard';
const FOOD_KEY = 'food';
const TICK_RATE_MS = 1000;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRedisPlayerId(id: string) {
  return PLAYER_KEY.concat(':', id);
}

function getRedisFoodId(id: string) {
  return FOOD_KEY.concat(':', id);
}

(async () => {
  await redis.del(PLAYER_KEY, LEADERBOARD_KEY, FOOD_KEY);
  const m = redis.multi();
  for (let i = 0; i < 100; i++) {
    for (let i = 0; i < 100; i++) {
      const id = randomUUID();
      m.hset(`${FOOD_KEY}:${id}`, {
        id: id,
        x: rand(-500, 500).toString(),
        y: rand(-500, 500).toString(),
        size: '5'
      });
    }
  }
  await m.exec();
})().catch(console.error);

const httpServer = http.createServer();
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  const id = socket.id;
  const playerRedisId = PLAYER_KEY.concat(':', id);
  const nick = (socket.handshake.query.nick as string) || 'Anonymous';
  const startingPlayerSize = 20;
  const playerColor = `hsl(${Math.random() * 360},70%,50%)`

  redis.hset(playerRedisId, {
    nick: nick,
    x: '0',
    y: '0',
    size: startingPlayerSize.toString(),
    color: playerColor
  });
  
  redis.zadd(LEADERBOARD_KEY, startingPlayerSize, playerRedisId);

  socket.on('move', async (dir) => {
    try {
      const xStr = await redis.hget(playerRedisId, 'x');
      const yStr = await redis.hget(playerRedisId, 'y');
      const sizeStr = await redis.hget(playerRedisId, 'size');

      let x = parseFloat(xStr ?? '0');
      let y = parseFloat(yStr ?? '0');
      const size = parseFloat(sizeStr ?? '20');

      x = Math.max(-500, Math.min(500, x + dir.x * 5));
      y = Math.max(-500, Math.min(500, y + dir.y * 5));
      
      await redis.hset(playerRedisId, {
        x: x.toString(),
        y: y.toString()
      });
      await redis.zadd(LEADERBOARD_KEY, size, playerRedisId);
    } catch (err) {
      console.error('[MOVE ERROR]', err);
    }
  });

  socket.on('disconnect', async () => {
    await redis.del(playerRedisId);
    await redis.zrem(LEADERBOARD_KEY, playerRedisId);
  });
});

setInterval(async () => {
  try {
    // Get all player:* keys
    const playerKeys: string[] = [];
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, 'MATCH', 'player:*', 'COUNT', '100');
      cursor = Number(result[0]);
      playerKeys.push(...result[1]);
    } while (cursor !== 0);

    // Fetch each player hash
    let players = await Promise.all(
      playerKeys.map(async (key) => {
        const data = await redis.hgetall(key);
        return {
          id: key.split(':')[1], // Extract player ID
          nick: data.nick,
          x: parseFloat(data.x),
          y: parseFloat(data.y),
          size: parseFloat(data.size),
          color: data.color,
        } as Player;
      })
    );

    // Get all food
    const foodKeys: string[] = [];
    cursor = 0;
    do {
      const result = await redis.scan(cursor, 'MATCH', 'food:*', 'COUNT', '100');
      cursor = Number(result[0]);
      foodKeys.push(...result[1]);
    } while (cursor !== 0);

    const foods = await Promise.all(
      foodKeys.map(async (key) => {
        const data = await redis.hgetall(key);
        return {
          id: data.id,
          x: parseFloat(data.x),
          y: parseFloat(data.y),
          size: parseFloat(data.size),
        } as Food;
      })
    );

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
    toRemove.forEach(id => {
      let playerRedisId = getRedisPlayerId(id);
      batch.hdel(playerRedisId).zrem(LEADERBOARD_KEY, playerRedisId);
    });

    let currentFoodCount = foods.length;
    for (const p of players) {
      for (const f of foods) {
        const d = Math.hypot(p.x - f.x, p.y - f.y);
        if (d < p.size) {
          p.size += f.size * 0.5;
          let redisFoodId = getRedisFoodId(f.id);
          batch.hdel(redisFoodId);
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
    respawnOps.forEach(o => {
      let redisFoodId = getRedisFoodId(o.id);
      batch.hset(redisFoodId, {
        id: o.id,
        x: rand(-500, 500).toString(),
        y: rand(-500, 500).toString(),
        size: '5'
      })}
    );

    players.forEach((p) => {
      let playerRedisId = getRedisPlayerId(p.id);
        batch.hset(playerRedisId, {
            x: p.x,
            y: p.y,
            size: p.size
          })
      .zadd(LEADERBOARD_KEY, p.size, playerRedisId);
    });
    await batch.exec();

    // Leaders
    const top = await redis.zrevrange(
      LEADERBOARD_KEY,
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
