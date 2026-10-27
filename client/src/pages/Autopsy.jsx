import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Info, AlertTriangle, CheckCircle, XCircle, Clock, BookOpen, Quote } from 'lucide-react';
import api from '../lib/api.js';
import FlowerButton from '../components/FlowerButton.jsx';
import { formatCauseTag, formatYears, getConfidenceBadge, getClaimTypeBadge } from '../lib/utils.js';

/* ── Skeleton ─────────────────────────────────────────────── */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-zinc-800/60 ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

/* ── Origin badge for sources ─────────────────────────────── */
const ORIGIN_STYLES = {
  tavily:     'bg-indigo-950/70 text-indigo-300 border-indigo-800/50',
  wikipedia:  'bg-cyan-950/70 text-cyan-300 border-cyan-800/50',
  hackernews: 'bg-orange-950/70 text-orange-300 border-orange-800/50',
};

function OriginBadge({ origin }) {
  const label = origin === 'hackernews' ? 'Hacker News' : (origin || 'Unknown');
  const cls = ORIGIN_STYLES[origin] || 'bg-zinc-800/70 text-zinc-300 border-zinc-700/50';
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${cls}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}

/* ── Confidence tooltip ───────────────────────────────────── */
function ConfidenceTag({ confidence }) {
  const [show, setShow] = useState(false);
  const badge = getConfidenceBadge(confidence);
  return (
    <div className="relative inline-block">
      <button
        className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold cursor-pointer ${badge.classes}`}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label={`Confidence: ${badge.label}. ${badge.description}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
        {badge.label}
        <Info size={11} className="opacity-60" />
      </button>
      {show && (
        <div className="absolute top-full mt-2 left-0 w-72 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl text-xs text-zinc-300 leading-relaxed">
          {badge.description}
        </div>
      )}
    </div>
  );
}

/* ── Cause chip ───────────────────────────────────────────── */
const CAUSE_COLORS = [
  'bg-rose-950/50 text-rose-300 border-rose-800/40',
  'bg-amber-950/50 text-amber-300 border-amber-800/40',
  'bg-purple-950/50 text-purple-300 border-purple-800/40',
  'bg-sky-950/50 text-sky-300 border-sky-800/40',
];

function CauseChip({ cause, detail, index }) {
  const [open, setOpen] = useState(false);
  const cls = CAUSE_COLORS[index % CAUSE_COLORS.length];
  return (
    <div className={`rounded-xl border p-4 ${cls.replace('text-', 'border-').replace('/40', '/30')} bg-zinc-900/60 border-zinc-700/40`}>
      <span className={`inline-block text-xs px-2 py-0.5 rounded border font-semibold mb-2 ${cls}`}>
        {formatCauseTag(cause)}
      </span>
      {detail && <p className="text-sm text-zinc-300 leading-relaxed">{detail}</p>}
    </div>
  );
}

/* ── Timeline entry ───────────────────────────────────────── */
function TimelineEntry({ event }) {
  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-amber-700 border-2 border-amber-400/50" />
      <div className="ml-2">
        {event.year && (
          <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">{event.year}</span>
        )}
        <p className="text-sm text-zinc-300 mt-0.5 leading-relaxed">{event.event}</p>
        {event.sourceUrl && (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-400/60 hover:text-amber-400 mt-1 transition-colors"
          >
            Source <ExternalLink size={10} />
          </a>
        )}
      </div>
    </li>
  );
}

/* ── Claim row ────────────────────────────────────────────── */
function ClaimRow({ claim }) {
  const typeBadge = getClaimTypeBadge(claim.type);
  const verified = claim.verified;
  return (
    <li className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        {verified === true && <CheckCircle size={14} className="text-emerald-400" />}
        {verified === false && <XCircle size={14} className="text-rose-400" />}
        {verified == null && <AlertTriangle size={14} className="text-amber-400" />}
        <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${typeBadge.classes}`}>
          {typeBadge.label}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-zinc-200 leading-relaxed">{claim.claim}</p>
        {claim.sourceUrl && (
          <a
            href={claim.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-400/60 hover:text-amber-400 mt-1 transition-colors"
          >
            Source <ExternalLink size={10} />
          </a>
        )}
      </div>
    </li>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function Autopsy() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/api/autopsies/${id}`)
      .then(res => setData(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="text-7xl select-none">🪦</div>
        <h1 className="font-cinzel text-3xl text-zinc-200">Autopsy Not Found</h1>
        <p className="text-zinc-400">This startup's records may have been lost to time — or it never existed here.</p>
        <Link
          to="/"
          className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-amber-700/30 border border-amber-600/40 text-amber-300 text-sm font-semibold hover:bg-amber-700/50 transition-colors"
        >
          ← Return to the Graveyard
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const {
    startupName,
    epitaph,
    industry,
    foundedYear,
    diedYear,
    summary,
    causes = [],
    causeDetails = '',
    timeline = [],
    founderQuotes = [],
    claims = [],
    sources = [],
    confidence,
    flowerCount = 0,
  } = data;

  const badge = getConfidenceBadge(confidence);

  return (
    <article className="max-w-4xl mx-auto px-4 py-10 space-y-12">

      {/* ── Breadcrumb ── */}
      <nav className="text-sm text-zinc-500">
        <Link to="/" className="hover:text-amber-400 transition-colors">Graveyard</Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-300">{startupName}</span>
      </nav>

      {/* ── Header ── */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          {industry && (
            <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
              {industry}
            </span>
          )}
          <ConfidenceTag confidence={confidence} />
        </div>

        <h1 className="font-cinzel text-4xl md:text-5xl text-zinc-100 leading-tight">
          {startupName}
        </h1>

        {epitaph && (
          <p className="text-lg text-zinc-400 italic">"{epitaph}"</p>
        )}

        <p className="text-sm text-zinc-500">{formatYears(foundedYear, diedYear)}</p>

        <div className="flex items-center gap-4 pt-1">
          <FlowerButton autopsyId={data._id} initialCount={flowerCount} />
        </div>
      </header>

      {/* ── Summary ── */}
      <section aria-label="Summary">
        <h2 className="font-cinzel text-xl text-amber-400/80 mb-3 flex items-center gap-2">
          <BookOpen size={18} /> The Autopsy
        </h2>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
          <p className="text-zinc-300 leading-relaxed text-[15px]">{summary}</p>
        </div>
      </section>

      {/* ── Cause of Death ── */}
      {causes.length > 0 && (
        <section aria-label="Causes of death">
          <h2 className="font-cinzel text-xl text-amber-400/80 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> Cause of Death
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {causes.map((cause, i) => (
              <CauseChip
                key={cause}
                cause={cause}
                detail={i === 0 ? causeDetails : undefined}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Timeline ── */}
      {timeline.length > 0 && (
        <section aria-label="Timeline">
          <h2 className="font-cinzel text-xl text-amber-400/80 mb-4 flex items-center gap-2">
            <Clock size={18} /> Timeline
          </h2>
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-6">
            <ol className="space-y-5 border-l-2 border-amber-800/40 ml-1.5 pl-2">
              {timeline.map((event, i) => (
                <TimelineEntry key={i} event={{ ...event, year: event.year ?? event.date }} />
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── Founder Quotes ── */}
      {founderQuotes.length > 0 && (
        <section aria-label="Founder quotes">
          <h2 className="font-cinzel text-xl text-amber-400/80 mb-4 flex items-center gap-2">
            <Quote size={18} /> In Their Own Words
          </h2>
          <div className="space-y-4">
            {founderQuotes.map((q, i) => (
              <blockquote
                key={i}
                className="relative bg-zinc-900/60 border-l-4 border-amber-700/50 rounded-r-xl pl-5 pr-6 py-4"
              >
                <p className="text-zinc-300 italic leading-relaxed">"{q.quote}"</p>
                <footer className="mt-2 text-xs text-zinc-500">
                  {(q.author || q.attribution) && <span className="font-semibold text-zinc-400">— {q.author || q.attribution}</span>}
                  {q.sourceUrl && (
                    <a
                      href={q.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-amber-400/60 hover:text-amber-400 transition-colors"
                    >
                      Source <ExternalLink size={10} />
                    </a>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* ── Claims ── */}
      {claims.length > 0 && (
        <section aria-label="Verified claims">
          <h2 className="font-cinzel text-xl text-amber-400/80 mb-2 flex items-center gap-2">
            <CheckCircle size={18} /> Claims & Verification
          </h2>
          <p className="text-xs text-zinc-500 mb-4">
            <CheckCircle size={10} className="inline text-emerald-400 mr-1" />Verified &nbsp;
            <XCircle size={10} className="inline text-rose-400 mr-1" />Disputed &nbsp;
            <AlertTriangle size={10} className="inline text-amber-400 mr-1" />Unverified
          </p>
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-5 py-2">
            <ul className="divide-y divide-zinc-800/40">
              {claims.map((claim, i) => (
                <ClaimRow key={i} claim={{ ...claim, claim: claim.claim ?? claim.text }} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Sources ── */}
      {sources.length > 0 && (
        <section aria-label="Sources">
          <h2 className="font-cinzel text-xl text-amber-400/80 mb-4 flex items-center gap-2">
            <ExternalLink size={18} /> Sources
          </h2>
          <ul className="space-y-3">
            {sources.map((src, i) => (
              <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-zinc-900/40 border border-zinc-800/50 rounded-lg px-4 py-3">
                <OriginBadge origin={src.origin} />
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-zinc-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 min-w-0"
                >
                  <span className="truncate">{src.title || src.url}</span>
                  <ExternalLink size={11} className="shrink-0 opacity-60" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Disclaimer ── */}
      <footer className="text-xs text-zinc-600 bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-4 leading-relaxed">
        <strong className="text-zinc-500">Disclaimer:</strong> This autopsy was generated by an AI using publicly available sources.
        It may contain inaccuracies or reflect incomplete information. Claims are labelled by their source type and verification status.
        Nothing here constitutes legal, financial, or defamatory attribution.
      </footer>

    </article>
  );
}
