import { useState, useContext, type FormEvent } from 'react';
import { PlayerContext } from '../../context/PlayerContext';

export function Menu() {
  const [input, setInput] = useState('');
  const { enterGame } = useContext(PlayerContext);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) enterGame(input.trim());
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={onSubmit} className="p-6 bg-white rounded-xl shadow-lg">
        <label className="block mb-2 text-lg font-medium">
          Enter your nickname
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded"
        >
          Play
        </button>
      </form>
    </div>
  );
}
