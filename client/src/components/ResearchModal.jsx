import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Brain, CheckCircle2, AlertCircle, X, Loader2, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 'searching', label: 'Searching public sources', desc: 'Querying Tavily, Wikipedia & Hacker News', icon: Search },
  { id: 'reading', label: 'Reading sources & pre-check', desc: 'Validating relevance and filtering noise', icon: BookOpen },
  { id: 'analyzing', label: 'Analyzing post-mortem with AI', desc: 'Extracting causes, timeline & epitaph', icon: Brain },
  { id: 'verifying', label: 'Verifying claims & quotes', desc: 'Checking facts and founder statements', icon: CheckCircle2 },
  { id: 'done', label: 'Autopsy Complete', desc: 'Carving tombstone into the graveyard', icon: Sparkles },
];

const STAGE_ORDER = ['searching', 'reading', 'analyzing', 'verifying', 'done'];

/**
 * Live SSE Research Modal
 *
 * @param {{
 *   isOpen: boolean,
 *   startupName: string,
 *   onClose: () => void
 * }} props
 */
export default function ResearchModal({ isOpen, startupName, onClose }) {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState('searching');
  const [stageMessage, setStageMessage] = useState('Initiating source discovery...');
  const [status, setStatus] = useState('loading'); // 'loading' | 'notfound' | 'error' | 'success'
  const [errorMessage, setErrorMessage] = useState('');
  const [articles, setArticles] = useState([]);
  const eventSourceRef = useRef(null);

  const startStream = () => {
    if (!startupName) return;

    // Reset state
    setStatus('loading');
    setCurrentStage('searching');
    setStageMessage('Searching public sources...');
    setErrorMessage('');

    // Close any prior stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const streamUrl = `${apiUrl}/api/search/stream?q=${encodeURIComponent(startupName.trim())}`;

    console.log(`[ResearchModal] Connecting to SSE: ${streamUrl}`);
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.stage) {
          if (data.stage === 'cached') {
            setCurrentStage('done');
          } else {
            setCurrentStage(data.stage);
          }
        }
        if (data.message) {
          setStageMessage(data.message);
        }
      } catch (err) {
        console.error('Error parsing progress SSE:', err);
      }
    });

    es.addEventListener('result', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.autopsyId) {
          setStatus('success');
          setCurrentStage('done');
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          // Navigate to the autopsy page
          setTimeout(() => {
            onClose();
            navigate(`/autopsy/${data.autopsyId}`);
          }, 600);
        }
      } catch (err) {
        console.error('Error parsing result SSE:', err);
      }
    });

    es.addEventListener('notfound', (e) => {
      try {
        const data = JSON.parse(e.data);
        setStatus('notfound');
        setErrorMessage(data.message || "We couldn't find enough public information about this one.");
      } catch (_) {
        setStatus('notfound');
        setErrorMessage("We couldn't find enough public information about this one.");
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    });

    es.addEventListener('error', (e) => {
      // EventSource fires generic error on server disconnect or custom error event
      let msg = 'The AI service is unavailable right now. Please try again.';
      if (e.data) {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.message) msg = parsed.message;
        } catch (_) {}
      }
      setStatus('error');
      setErrorMessage(msg);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    });

    es.addEventListener('fallback', (e) => {
      const data = JSON.parse(e.data);
      setStatus('error'); setErrorMessage(data.message); setArticles(data.sources || []);
      es.close(); eventSourceRef.current = null;
    });

  };

  useEffect(() => {
    if (isOpen && startupName) {
      startStream();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen, startupName]);

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto tombstone-arch bg-gradient-to-b from-[#181d24] via-[#12161c] to-[#0c0f13] border border-zinc-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] p-6 sm:p-8 pt-10 z-10"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100 p-1 rounded-full hover:bg-zinc-800/60 transition-colors"
            aria-label="Cancel research"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-3 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              🪦
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-wide text-zinc-100">
              Exhuming Autopsy
            </h2>
            <p className="text-amber-300 font-serif text-lg font-semibold mt-1">
              "{startupName}"
            </p>
          </div>

          {/* Body Content based on Status */}
          {status === 'loading' && (
            <div className="space-y-4">
              {/* Stepper */}
              <div className="space-y-3 my-4">
                {STEPS.map((step, idx) => {
                  const stepIndex = STAGE_ORDER.indexOf(step.id);
                  const isDone = stepIndex < currentStageIndex;
                  const isCurrent = stepIndex === currentStageIndex;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3.5 p-3 rounded-lg border transition-all duration-300 ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : isDone
                          ? 'bg-zinc-900/60 border-emerald-900/40 text-zinc-300'
                          : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isCurrent ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Icon className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${isCurrent ? 'text-amber-200' : isDone ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {isCurrent ? stageMessage : step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cancel Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status === 'notfound' && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-400 mb-1">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                Not Enough Information
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {errorMessage || "We couldn't find enough verified public records to compile a reliable autopsy for this startup."}
              </p>
              <div className="pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium border border-zinc-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 mb-1">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-rose-200">
                Exhumation Halted
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {errorMessage || 'The AI service is unavailable right now. Please try again shortly.'}
              </p>
              {articles.map((a, i) => /^https?:\/\//i.test(a.url) && <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block p-3 border border-zinc-700 rounded-lg text-amber-300 text-left">{a.title}<span className="block text-xs text-zinc-400">{a.origin}</span></a>)}
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm border border-zinc-700 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={startStream}
                  className="px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm font-medium border border-amber-500/40 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
