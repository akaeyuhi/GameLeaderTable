import { Game } from './components/Game/Game.tsx';
import { useContext } from 'react';
import { PlayerContext, PlayerProvider } from './context/PlayerContext.tsx';
import { Menu } from './components/Menu/Menu.tsx';

function AppInner() {
  const { socketInitialized } = useContext(PlayerContext);
  return socketInitialized ? <Game /> : <Menu />;
}

function App() {
  return (
    <PlayerProvider>
      <AppInner />
    </PlayerProvider>
  );
}

export default App;
