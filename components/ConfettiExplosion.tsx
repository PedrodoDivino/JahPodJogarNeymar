'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  trigger: boolean;
}

export default function ConfettiExplosion({ trigger }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!trigger) return;

    const fire = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#16a34a', '#22c55e', '#ffffff', '#facc15', '#4ade80'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#16a34a', '#22c55e', '#ffffff', '#facc15', '#4ade80'],
      });
    };

    fire();
    const burst = () => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#16a34a', '#22c55e', '#ffffff', '#facc15', '#4ade80'],
      });
    };
    burst();

    intervalRef.current = setInterval(() => {
      fire();
    }, 500);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [trigger]);

  return null;
}