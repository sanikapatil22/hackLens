'use client';

import { useEffect, useRef, useState } from 'react';

export function CursorLaptopBg() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate parallax offset - subtler movement
  const parallaxX = (mousePosition.x - window.innerWidth / 2) * 0.05;
  const parallaxY = (mousePosition.y - window.innerHeight / 2) * 0.05;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ perspective: '1000px' }}
    >
      {/* Animated laptop element */}
      <div
        className="absolute opacity-10 transition-transform duration-300 ease-out"
        style={{
          bottom: '-20%',
          right: '-15%',
          transform: `translate(${parallaxX}px, ${parallaxY}px) rotateY(-25deg)`,
          width: '800px',
          height: '600px',
        }}
      >
        {/* Laptop SVG */}
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Screen */}
          <rect
            x="100"
            y="50"
            width="600"
            height="350"
            rx="15"
            fill="oklch(0.15 0.02 260)"
            stroke="oklch(0.55 0.3 180)"
            strokeWidth="3"
          />

          {/* Screen bezel gradient */}
          <defs>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="oklch(0.55 0.3 180)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="oklch(0.65 0.35 150)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Screen content - terminal lines */}
          <line
            x1="120"
            y1="100"
            x2="680"
            y2="100"
            stroke="oklch(0.55 0.3 180)"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <line
            x1="120"
            y1="130"
            x2="550"
            y2="130"
            stroke="oklch(0.65 0.35 150)"
            strokeWidth="1.5"
            opacity="0.3"
          />
          <line
            x1="120"
            y1="160"
            x2="620"
            y2="160"
            stroke="oklch(0.55 0.3 180)"
            strokeWidth="1.5"
            opacity="0.25"
          />
          <line
            x1="120"
            y1="190"
            x2="480"
            y2="190"
            stroke="oklch(0.65 0.35 150)"
            strokeWidth="1.5"
            opacity="0.2"
          />

          {/* Screen bottom accent */}
          <rect
            x="100"
            y="400"
            width="600"
            height="40"
            fill="oklch(0.11 0.01 260)"
            stroke="oklch(0.55 0.3 180)"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Trackpad */}
          <rect
            x="280"
            y="430"
            width="240"
            height="120"
            rx="8"
            fill="oklch(0.1 0.01 260)"
            stroke="oklch(0.55 0.3 180)"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Keyboard keys */}
          {[0, 1, 2, 3, 4].map((row) =>
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
              <rect
                key={`key-${row}-${col}`}
                x={160 + col * 60}
                y={420 + row * 25}
                width="50"
                height="20"
                rx="3"
                fill="oklch(0.08 0.01 260)"
                stroke="oklch(0.55 0.3 180)"
                strokeWidth="1"
                opacity="0.3"
              />
            )),
          )}

          {/* Hinge/Base */}
          <rect
            x="100"
            y="380"
            width="600"
            height="25"
            fill="oklch(0.1 0.01 260)"
            stroke="oklch(0.55 0.3 180)"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Base stand */}
          <path
            d="M 200 405 L 200 500 Q 200 520 220 520 L 580 520 Q 600 520 600 500 L 600 405"
            fill="oklch(0.08 0.01 260)"
            stroke="oklch(0.55 0.3 180)"
            strokeWidth="2"
            opacity="0.4"
          />

          {/* Accent glow effect */}
          <circle
            cx="400"
            cy="225"
            r="200"
            fill="oklch(0.55 0.3 180)"
            opacity="0.05"
          />
        </svg>
      </div>

      {/* Additional floating code elements */}
      <div
        className="absolute text-accent/20 font-mono text-xs"
        style={{
          top: '10%',
          left: '5%',
          transform: `translate(${parallaxX * 0.7}px, ${parallaxY * 0.7}px)`,
        }}
      >
        <div>{'<'}/security{'>'}</div>
        <div className="mt-2">const analyze = (url)</div>
      </div>

      <div
        className="absolute text-primary/20 font-mono text-xs"
        style={{
          bottom: '15%',
          right: '10%',
          transform: `translate(${parallaxX * 0.6}px, ${parallaxY * 0.6}px)`,
        }}
      >
        <div>{'['} vulnerability {']'}</div>
        <div className="mt-2">security.scan()</div>
      </div>
    </div>
  );
}
