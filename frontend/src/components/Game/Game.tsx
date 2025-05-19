import { useEffect, useState } from 'react';
import { getSocket } from '../../services/socket.service';
import { useKeyboard } from '../../hooks/useKeyboard';
import type { Player, Food, Leader } from '../../types';
import { Cell } from './Cell';
import { Leaderboard } from '../Leaderboard/Leaderboard';

const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 600;
const WORLD_HALF = 500; // the world spans -500 to +500 in both axes

export function Game() {
  const dir = useKeyboard();
  const socket = getSocket();

  const [players, setPlayers] = useState<Player[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  // Subscribe to game state
  useEffect(() => {
    const handler = (payload: {
      players: Player[];
      foods: Food[];
      leaders: Leader[];
    }) => {
      setPlayers(payload.players);
      setFoods(payload.foods);
      setLeaders(payload.leaders);

      if (!payload.players.some((p) => p.id === socket.id)) {
        alert('You were eaten! Refresh to play again.');
      }
    };

    socket.on('state', handler);
    return () => {
      socket.off('state', handler);
    };
  }, [socket]);

  // Emit movement
  useEffect(() => {
    socket.emit('move', dir);
  }, [dir, socket]);

  // Pre-generate food color map
  const [foodColorMap] = useState<Record<string, string>>({});
  const getFoodColor = (id: string) => {
    if (!foodColorMap[id]) {
      const hue =
        id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
      foodColorMap[id] = `hsl(${hue},70%,60%)`;
    }
    return foodColorMap[id];
  };

  const me = players.find((p) => p.id === socket.id);
  if (players.length === 0 || foods.length === 0 || !me) {
    return <h1>Loading...</h1>;
  }

  const offsetX = me.x;
  const offsetY = me.y;

  const worldToScreenX = (x: number) => {
    const rel = x - offsetX;
    const clamped = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, rel));
    return ((clamped + WORLD_HALF) / (WORLD_HALF * 2)) * VIEWPORT_WIDTH;
  };
  const worldToScreenY = (y: number) => {
    const rel = y - offsetY;
    const clamped = Math.max(-WORLD_HALF, Math.min(WORLD_HALF, rel));
    return ((clamped + WORLD_HALF) / (WORLD_HALF * 2)) * VIEWPORT_HEIGHT;
  };

  return (
    <div className="flex">
      <div
        className="relative bg-gray-50 border overflow-hidden"
        style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
      >
        {foods.map((f) => (
          <Cell
            key={f.id}
            x={worldToScreenX(f.x)}
            y={worldToScreenY(f.y)}
            size={f.size}
            color={getFoodColor(f.id)}
          />
        ))}
        {players.map((p) => (
          <Cell
            key={p.id}
            x={worldToScreenX(p.x)}
            y={worldToScreenY(p.y)}
            size={p.size}
            color={p.color}
          />
        ))}
      </div>
      <Leaderboard leaders={leaders} players={players} />
    </div>
  );
}
