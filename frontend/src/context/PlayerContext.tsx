import { createContext, useState, type ReactNode } from 'react';
import { connectSocket } from '../services/socket.service';

interface Context {
  nick: string;
  socketInitialized: boolean;
  enterGame: (nick: string) => void;
}
export const PlayerContext = createContext<Context>({} as any);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [nick, setNick] = useState('');
  const [socketInitialized, setSocketInitialized] = useState(false);

  const enterGame = (name: string) => {
    setNick(name);
    connectSocket(name);
    setSocketInitialized(true);
  };

  return (
    <PlayerContext.Provider value={{ nick, socketInitialized, enterGame }}>
      {children}
    </PlayerContext.Provider>
  );
}
