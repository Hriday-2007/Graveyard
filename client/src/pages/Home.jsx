import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RotateCcw, Sparkles, Flame, Clock, Calendar } from 'lucide-react';
import api from '../lib/api.js';
import { formatCauseTag } from '../lib/utils.js';
import TombstoneCard from '../components/TombstoneCard.jsx';
import ResearchModal from '../components/ResearchModal.jsx';

export default function Home() {
  const [autopsies, setAutopsies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('flowers'); // 'flowers' | 'recent' | 'new'
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedCause, setSelectedCause] = useState('all');

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({ industries: [], causes: [] });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Research modal state
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [researchTarget, setResearchTarget] = useState('');

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on new query
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch filter options on mount
  useEffect(() => {
    api
      .get('/api/autopsies/filters')
      .then((res) => {
        if (res.data) {
          setFilterOptions({
            industries: res.data.industries || [],
            causes: res.data.causes || [],
          });
        }
      })
      .catch((err) => console.error('Failed to load filters:', err));
  }, []);

  // Fetch autopsies
  const fetchAutopsies = (pageNum = 1) => {
    setLoading(true);
    setError(null);

    const params = {
      page: pageNum,
      limit: 12,
      sort: selectedSort,
    };

    if (debouncedQuery.trim()) {
      params.q = debouncedQuery.trim();
    }
    if (selectedIndustry !== 'all') {
      params.industry = selectedIndustry;
    }
    if (selectedCause !== 'all') {
      params.cause = selectedCause;
    }

    api
      .get('/api/autopsies', { params })
      .then((res) => {
        if (res.data) {
          setAutopsies(res.data.autopsies || []);
          setPage(res.data.page || 1);
          setTotalPages(res.data.pages || 1);
          setTotalCount(res.data.total || 0);
        }
      })
      .catch((err) => {
        console.error('Error fetching autopsies:', err);
        setError('Failed to load autopsies from the database.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAutopsies(page);
  }, [debouncedQuery, selectedSort, selectedIndustry, selectedCause, page]);

  // Handle Search Submission (Enter or Click)
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check if an existing tombstone matches the name exactly (case-insensitive)
    const exactMatch = autopsies.find(
      (a) => a.startupName.toLowerCase() === query.toLowerCase()
    );

    if (!exactMatch) {
      setResearchTarget(query);
      setIsResearchModalOpen(true);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedIndustry('all');
    setSelectedCause('all');
    setSelectedSort('flowers');
    setPage(1);
  };

  const hasActiveFilters =
    debouncedQuery || selectedIndustry !== 'all' || selectedCause !== 'all' || selectedSort !== 'flowers';

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-4 sm:pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-amber-300 text-xs font-serif tracking-wider uppercase"
        >
          <span>Memento Mori Startuporum</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="font-serif text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-100"
        >
          Startup Graveyard
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-base sm:text-lg text-zinc-400 leading-relaxed font-light"
        >
          Where ambitious ideas rest in peace. Forensically cited autopsies analyzing why once-hyped companies collapsed.
        </motion.p>

        {/* Big Search Bar */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSearchSubmit}
          className="relative max-w-2xl mx-auto pt-2"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a dead startup... (e.g. Quibi, Vine, Juicero)"
              className="w-full pl-12 pr-28 py-3.5 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-zinc-100 placeholder-zinc-500 text-base focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 shadow-lg transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Research
            </button>
          </div>

          {/* Helper hint or research action */}
          {debouncedQuery && autopsies.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <button
                type="button"
                onClick={() => {
                  setResearchTarget(debouncedQuery);
                  setIsResearchModalOpen(true);
                }}
                className="inline-flex items-center gap-2 text-xs text-amber-300/90 hover:text-amber-200 underline underline-offset-4"
              >
                <Sparkles className="w-3.5 h-3.5" />
                No tombstone found for "{debouncedQuery}". Click here to exhume and research it live &rarr;
              </button>
            </motion.div>
          )}
        </motion.form>
      </section>

      {/* Filter and Sort Toolbar */}
      <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sort Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-950/70 border border-zinc-800/70 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setSelectedSort('flowers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedSort === 'flowers'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Most Mourned</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSort('recent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedSort === 'recent'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recently Departed</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSort('new')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedSort === 'new'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Newly Exhumed</span>
            </button>
          </div>

          {/* Dropdown Filters & Clear */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Industry Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="industry-select" className="text-xs text-zinc-400 font-medium">
                Industry:
              </label>
              <select
                id="industry-select"
                value={selectedIndustry}
                onChange={(e) => {
                  setSelectedIndustry(e.target.value);
                  setPage(1);
                }}
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All Industries</option>
                {filterOptions.industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Cause Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="cause-select" className="text-xs text-zinc-400 font-medium">
                Cause:
              </label>
              <select
                id="cause-select"
                value={selectedCause}
                onChange={(e) => {
                  setSelectedCause(e.target.value);
                  setPage(1);
                }}
                className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/50 max-w-[200px] truncate"
              >
                <option value="all">All Causes</option>
                {filterOptions.causes.map((c) => (
                  <option key={c} value={c}>
                    {formatCauseTag(c)}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Cemetery Grid */}
      <section className="space-y-8">
        {loading ? (
          /* Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="tombstone-arch bg-zinc-900/40 border border-zinc-800/60 p-6 pt-10 min-h-[340px] animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4 flex flex-col items-center">
                  <div className="w-10 h-1 bg-zinc-800 rounded" />
                  <div className="w-3/4 h-6 bg-zinc-800 rounded mt-2" />
                  <div className="w-1/2 h-4 bg-zinc-800/60 rounded" />
                  <div className="w-20 h-5 bg-zinc-800/40 rounded-full mt-2" />
                  <div className="w-5/6 h-12 bg-zinc-800/30 rounded mt-4" />
                </div>
                <div className="pt-4 border-t border-zinc-800/60 flex justify-between items-center">
                  <div className="w-24 h-4 bg-zinc-800 rounded" />
                  <div className="w-12 h-6 bg-zinc-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-8 space-y-4">
            <p className="text-rose-400 font-medium">{error}</p>
            <button
              type="button"
              onClick={() => fetchAutopsies(page)}
              className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg text-sm border border-zinc-700 hover:bg-zinc-750"
            >
              Try Again
            </button>
          </div>
        ) : autopsies.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-gradient-to-b from-zinc-900/30 to-zinc-950/60 border border-zinc-800/80 rounded-3xl p-8 sm:p-12 space-y-4 max-w-xl mx-auto">
            <div className="text-5xl mb-2">🪦</div>
            <h3 className="font-serif text-2xl font-bold text-zinc-100">
              The graveyard is quiet...
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {debouncedQuery
                ? `No autopsies found matching "${debouncedQuery}". Would you like to research it?`
                : 'No fallen startups are buried here yet. Search for any failed venture to exhume its story.'}
            </p>
            {debouncedQuery && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setResearchTarget(debouncedQuery);
                    setIsResearchModalOpen(true);
                  }}
                  className="px-6 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded-xl border border-amber-500/40 text-sm transition-all hover:scale-105"
                >
                  Research "{debouncedQuery}" with AI &rarr;
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {autopsies.map((autopsy, index) => (
              <TombstoneCard key={autopsy._id} autopsy={autopsy} index={index} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-3 pt-6">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500 font-mono">
              Page {page} of {totalPages} ({totalCount} buried)
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Live Research Modal */}
      <ResearchModal
        isOpen={isResearchModalOpen}
        startupName={researchTarget}
        onClose={() => setIsResearchModalOpen(false)}
      />
    </div>
  );
}
