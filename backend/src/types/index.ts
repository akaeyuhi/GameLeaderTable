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
