import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flower } from 'lucide-react';
import api from '../lib/api.js';

/**
 * Interactive Flower Tribute Button with Optimistic UI & pop animation.
 *
 * @param {{
 *   autopsyId: string,
 *   initialCount?: number,
 *   size?: 'sm' | 'md' | 'lg'
 * }} props
 */
export default function FlowerButton({ autopsyId, initialCount = 0, size = 'sm' }) {
  const [flowerCount, setFlowerCount] = useState(initialCount);
  const [flowered, setFlowered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Sync count on initial mount or autopsy change
  useEffect(() => {
    let isMounted = true;
    setFlowerCount(initialCount);

    if (!autopsyId) return;

    api
      .get(`/api/autopsies/${autopsyId}/flower`)
      .then((res) => {
        if (isMounted && res.data) {
          setFlowered(Boolean(res.data.flowered));
          if (typeof res.data.flowerCount === 'number') {
            setFlowerCount(res.data.flowerCount);
          }
        }
      })
      .catch(() => {
        // Silently tolerate background fetch error
      });

    return () => {
      isMounted = false;
    };
  }, [autopsyId, initialCount]);

  const handleToggleFlower = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || !autopsyId) return;

    // Save previous state for rollback
    const prevFlowered = flowered;
    const prevCount = flowerCount;

    // Optimistic UI update
    const nextFlowered = !prevFlowered;
    const nextCount = nextFlowered ? prevCount + 1 : Math.max(0, prevCount - 1);

    setFlowered(nextFlowered);
    setFlowerCount(nextCount);
    setLoading(true);

    if (nextFlowered) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }

    try {
      const res = await api.post(`/api/autopsies/${autopsyId}/flower`);
      if (res.data) {
        setFlowered(Boolean(res.data.flowered));
        setFlowerCount(res.data.flowerCount);
      }
    } catch (err) {
      // Rollback on error
      console.error('Failed to update flower tribute:', err);
      setFlowered(prevFlowered);
      setFlowerCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  const isLarge = size === 'lg';
  const isMedium = size === 'md';

  return (
    <button
      type="button"
      onClick={handleToggleFlower}
      disabled={loading}
      aria-label={flowered ? 'Remove flower tribute' : 'Lay a flower in memory'}
      title={flowered ? 'You laid a flower. Click to remove.' : 'Lay a flower in memory'}
      className={`relative inline-flex items-center gap-2 rounded-full transition-all duration-200 select-none ${
        isLarge
          ? 'px-5 py-2.5 text-base font-medium'
          : isMedium
          ? 'px-3.5 py-1.5 text-sm font-medium'
          : 'px-2.5 py-1 text-xs font-normal'
      } ${
        flowered
          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:bg-amber-500/25'
          : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-amber-300 hover:border-amber-500/30'
      } ${loading ? 'opacity-80 cursor-wait' : 'cursor-pointer active:scale-95'}`}
    >
      <motion.div
        animate={animating ? { scale: [1, 1.45, 0.9, 1.15, 1], rotate: [0, -15, 15, -5, 0] } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative"
      >
        <Flower
          className={`${isLarge ? 'w-5 h-5' : 'w-3.5 h-3.5'} transition-colors ${
            flowered ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'
          }`}
        />

        {/* Small floating flower particle burst */}
        <AnimatePresence>
          {animating && (
            <motion.span
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -24, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute -top-1 -right-1 text-xs pointer-events-none"
            >
              🌸
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <span className="tabular-nums font-medium tracking-tight">
        {flowerCount}
      </span>
      {isLarge && (
        <span className="text-zinc-300 text-sm ml-0.5">
          {flowered ? 'Flower Laid' : 'Lay a Flower'}
        </span>
      )}
    </button>
  );
}
