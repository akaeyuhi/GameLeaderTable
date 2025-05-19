import type { Leader, Player } from '../../types';

interface LeaderboardProps {
  leaders: Leader[];
  players: Player[];
}

export function Leaderboard({ leaders, players }: LeaderboardProps) {
  return (
    <aside className="ml-4 w-48 p-4 bg-white shadow rounded">
      <h2 className="text-lg font-semibold mb-2">Top Players</h2>
      <ol className="list-decimal list-inside space-y-1">
        {leaders.map((l) => {
          const p = players.find((pl) => pl.id === l.id);
          return (
            <li key={l.id} className="flex justify-between">
              <span className="truncate">{p?.nick ?? '—'}</span>
              <span className="font-mono">{Math.floor(l.size)}</span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
