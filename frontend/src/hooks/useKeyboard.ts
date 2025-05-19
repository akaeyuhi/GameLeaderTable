// useKeyboard.ts
import { useEffect, useState } from 'react';

type Dir = { x: number; y: number };

export function useKeyboard() {
  const [dir, setDir] = useState<Dir>({ x: 0, y: 0 });

  useEffect(() => {
    // map key → [dx, dy]
    const map: Record<string, Dir> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      a: { x: -1, y: 0 },
      d: { x: 1, y: 0 },
      W: { x: 0, y: -1 },
      S: { x: 0, y: 1 },
      A: { x: -1, y: 0 },
      D: { x: 1, y: 0 },
    };

    const pressed = new Set<string>();

    const update = () => {
      // sum up all dx/dy, then normalize to -1|0|1
      let x = 0,
        y = 0;
      pressed.forEach((key) => {
        const d = map[key];
        if (d) {
          x += d.x;
          y += d.y;
        }
      });
      setDir({
        x: x === 0 ? 0 : x > 0 ? 1 : -1,
        y: y === 0 ? 0 : y > 0 ? 1 : -1,
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (map[e.key]) {
        pressed.add(e.key);
        update();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (pressed.delete(e.key)) {
        update();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return dir;
}
