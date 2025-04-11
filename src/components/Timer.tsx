import React, { useEffect } from 'react';
import { Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  isActive: boolean;
}

export function Timer({ timeLeft, setTimeLeft, isActive }: TimerProps) {
  useEffect(() => {
    let interval: number;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timeLeft, isActive, setTimeLeft]);

  const percentage = (timeLeft / 60) * 100;
  const color = timeLeft > 30 ? 'text-green-500' : timeLeft > 10 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="flex items-center gap-2">
      <TimerIcon className={`w-6 h-6 ${color}`} />
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-mono font-bold ${color}`}>{timeLeft}s</span>
    </div>
  );
}