import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Skull, BarChart3, Compass, Info } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Fog Animation Layer (Atmospheric cemetery drift) */}
      <div className="fog-wrapper" aria-hidden="true">
        <div className="fog-blob fog-1" />
        <div className="fog-blob fog-2" />
        <div className="fog-blob fog-3" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0b0d10]/80 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg px-1 py-0.5"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 group-hover:border-amber-500/40 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
              <span className="text-xl">🪦</span>
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-wider text-zinc-100 group-hover:text-amber-200 transition-colors">
                Startup Graveyard
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/80 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 hover:bg-zinc-800/40'
                }`
              }
            >
              <Compass className="w-4 h-4" />
              <span>The Archive</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/80 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 hover:bg-zinc-800/40'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" />
              <span>The Patterns</span>
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Page Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-[#080a0d]/90 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="flex items-center justify-center gap-1.5 text-zinc-400">
            <Info className="w-3.5 h-3.5 text-zinc-500" />
            Compiled from public sources by AI. Not a source of absolute fact. Always check the linked sources.
          </p>
          <p className="text-zinc-600">
            Startup Graveyard 🪦 &bull; Forensic autopsies for fallen ventures.
          </p>
        </div>
      </footer>
    </div>
  );
}
