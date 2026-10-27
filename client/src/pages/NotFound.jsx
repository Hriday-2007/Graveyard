import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-6">

      {/* Tombstone illustration */}
      <div className="relative select-none">
        <span className="text-8xl md:text-9xl" role="img" aria-label="Tombstone">🪦</span>
        <span className="absolute -top-2 -right-4 text-2xl animate-bounce">❓</span>
      </div>

      <div className="space-y-2">
        <p className="text-7xl font-bold font-cinzel text-amber-700/60 leading-none">404</p>
        <h1 className="font-cinzel text-2xl md:text-3xl text-zinc-200">
          This Page Has Passed On
        </h1>
        <p className="text-zinc-400 text-sm max-w-sm">
          Like the startups we chronicle, this URL no longer exists —
          perhaps it was pivoted away, acquired into oblivion, or simply never was.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Link
          to="/"
          id="not-found-home-link"
          className="px-6 py-2.5 rounded-lg bg-amber-700/30 border border-amber-600/40 text-amber-300 text-sm font-semibold hover:bg-amber-700/50 transition-colors"
        >
          ← Return to the Graveyard
        </Link>
        <Link
          to="/dashboard"
          id="not-found-dashboard-link"
          className="px-6 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          📊 View Dashboard
        </Link>
      </div>

      {/* Atmospheric epitaph */}
      <p className="text-xs text-zinc-700 italic mt-8">
        "Here lies a broken URL. It tried. It failed. It will not be missed."
      </p>
    </div>
  );
}
