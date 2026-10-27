import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCauseTag, formatYears } from '../lib/utils.js';
import FlowerButton from './FlowerButton.jsx';

/**
 * Tombstone-shaped card representing a fallen startup in the cemetery.
 *
 * @param {{
 *   autopsy: {
 *     _id: string,
 *     startupName: string,
 *     foundedYear?: number,
 *     diedYear?: number,
 *     epitaph: string,
 *     industry: string,
 *     causes?: string[],
 *     flowerCount?: number
 *   },
 *   index?: number
 * }} props
 */
export default function TombstoneCard({ autopsy, index = 0 }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/autopsy/${autopsy._id}`);
  };

  const yearsText = formatYears(autopsy.foundedYear, autopsy.diedYear);
  const displayCauses = (autopsy.causes || []).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.5), ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      className="group relative cursor-pointer flex flex-col justify-between tombstone-arch bg-gradient-to-b from-[#1c222b] via-[#14181f] to-[#0f1217] border border-zinc-800/80 hover:border-amber-500/40 hover:shadow-[0_10px_35px_-5px_rgba(212,175,55,0.18)] transition-all duration-300 p-6 pt-9 min-h-[340px]"
    >
      {/* Decorative cross/engraving accent at top of arch */}
      <div className="flex flex-col items-center mb-3">
        <div className="w-6 h-0.5 bg-zinc-700/60 rounded-full group-hover:bg-amber-500/40 transition-colors" />
        <div className="w-0.5 h-3 bg-zinc-700/60 rounded-full -mt-0.5 group-hover:bg-amber-500/40 transition-colors" />
      </div>

      {/* Main Content */}
      <div className="text-center flex-1 flex flex-col items-center">
        {/* Startup Name */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-zinc-100 group-hover:text-amber-200 transition-colors line-clamp-1">
          {autopsy.startupName}
        </h3>

        {/* Years of existence */}
        <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mt-1 mb-4">
          {yearsText}
        </p>

        {/* Industry badge */}
        <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium tracking-wider uppercase bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 rounded-full mb-3">
          {autopsy.industry || 'Technology'}
        </span>

        {/* Epitaph */}
        <p className="text-sm italic text-zinc-400 group-hover:text-zinc-300 leading-relaxed max-w-[90%] px-2 mt-auto line-clamp-3">
          "{autopsy.epitaph || 'Resting in peace among the fallen ventures.'}"
        </p>
      </div>

      {/* Card Footer: Causes & Flower Tribute */}
      <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        {/* Cause chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
          {displayCauses.length > 0 ? (
            displayCauses.map((cause, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded bg-zinc-850 bg-zinc-900/90 text-zinc-400 border border-zinc-800 truncate max-w-[130px]"
                title={formatCauseTag(cause)}
              >
                {formatCauseTag(cause)}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-zinc-600 italic">Unknown cause</span>
          )}
        </div>

        {/* Flower Tribute Button */}
        <div onClick={(e) => e.stopPropagation()}>
          <FlowerButton autopsyId={autopsy._id} initialCount={autopsy.flowerCount || 0} size="sm" />
        </div>
      </div>
    </motion.div>
  );
}
