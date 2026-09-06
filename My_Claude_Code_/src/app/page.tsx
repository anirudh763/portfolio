'use client';
import React, { useState, useEffect } from 'react';
import { FallbackView2D } from '../components/ui/FallbackView2D';
import { DroneSimulationScene } from '../components/canvas/drone/DroneSimulationScene';
import { useAppStore } from '../store/useAppStore';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const { setReduceMotion } = useAppStore();

  useEffect(() => {
    setMounted(true);
    // Respect OS reduced motion settings automatically
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white font-sans">
      <nav className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">Systems & Accessibility Research</h1>
        <div className="flex gap-4">
          <button 
            className={`px-4 py-2 font-medium rounded ${viewMode === '3D' ? 'bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            onClick={() => setViewMode('3D')}
            aria-pressed={viewMode === '3D'}
          >
            3D Cyber-Physical / Memory Canvas
          </button>
          <button 
            className={`px-4 py-2 font-medium rounded ${viewMode === '2D' ? 'bg-blue-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            onClick={() => setViewMode('2D')}
            aria-pressed={viewMode === '2D'}
          >
            WCAG 2.2 AAA Data Mirror
          </button>
        </div>
      </nav>

      {viewMode === '3D' ? (
        <div className="p-8">
           <DroneSimulationScene />
        </div>
      ) : (
        <FallbackView2D />
      )}
    </main>
  );
}
