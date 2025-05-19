export interface Player {
  id: string;
  nick: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface Leader {
  id: string;
  size: number;
}

export interface ClientToServerEvents {
  move: (dir: { x: number; y: number }) => void;
}

export interface ServerToClientEvents {
  state: (payload: {
    players: Player[];
    foods: Food[];
    leaders: Leader[];
  }) => void;
}
