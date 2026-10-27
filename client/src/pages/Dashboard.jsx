import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import api from '../lib/api.js';
import { formatCauseTag } from '../lib/utils.js';

/* ── Theme colours ────────────────────────────────────────── */
const GOLD   = '#d4af37';
const MUTED  = '#6b7280';
const CAUSES_PALETTE = [
  '#c0392b','#e67e22','#f39c12','#16a085',
  '#2980b9','#8e44ad','#27ae60','#d35400',
  '#2c3e50','#7f8c8d',
];
const INDUSTRY_PALETTE = [
  '#6366f1','#ec4899','#14b8a6','#f59e0b',
  '#84cc16','#f97316','#8b5cf6','#06b6d4',
  '#ef4444','#10b981',
];

/* ── Reusable card ────────────────────────────────────────── */
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800/60 rounded-xl p-6 flex flex-col gap-1 hover:border-amber-700/40 transition-colors">
      <span className="text-3xl font-bold text-amber-400 font-cinzel">{value ?? '—'}</span>
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

/* ── Custom tooltip ───────────────────────────────────────── */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 shadow-xl">
      {label && <p className="font-semibold text-amber-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name || p.dataKey}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

/* ── Section wrapper ──────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <section className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6">
      <h2 className="font-cinzel text-lg text-amber-400/80 mb-5">{title}</h2>
      {children}
    </section>
  );
}

/* ── Empty state ──────────────────────────────────────────── */
function EmptyState({ message = 'No data yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-600 space-y-3">
      <span className="text-5xl select-none">📉</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ── Custom Pie label ─────────────────────────────────────── */
const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#e4e4e7" textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ── Main Dashboard ───────────────────────────────────────── */
export default function Dashboard() {
  const [autopsies, setAutopsies] = useState([]);
  const [causesData, setCausesData] = useState([]);
  const [industriesData, setIndustriesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/autopsies'),
      api.get('/stats/causes'),
      api.get('/stats/industries'),
    ])
      .then(([aRes, cRes, iRes]) => {
        setAutopsies(aRes.data.autopsies || []);
        // causes endpoint returns [{ cause, count }]
        setCausesData(
          (cRes.data || []).map(d => ({
            name: formatCauseTag(d.cause || d._id),
            count: d.count,
          })).sort((a, b) => b.count - a.count).slice(0, 10)
        );
        // industries endpoint returns [{ industry, count }]
        setIndustriesData(
          (iRes.data || []).map(d => ({
            name: d.industry || d._id || 'Other',
            count: d.count,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived stats ── */
  const total = autopsies.length;

  const avgLifespan = total
    ? +(autopsies
        .filter(a => a.foundedYear && a.diedYear)
        .map(a => a.diedYear - a.foundedYear)
        .reduce((s, v) => s + v, 0) /
        Math.max(autopsies.filter(a => a.foundedYear && a.diedYear).length, 1)
      ).toFixed(1)
    : null;

  // Deaths per year
  const yearMap = {};
  autopsies.forEach(a => {
    if (a.diedYear) yearMap[a.diedYear] = (yearMap[a.diedYear] || 0) + 1;
  });
  const deathsPerYear = Object.entries(yearMap)
    .map(([year, deaths]) => ({ year: +year, deaths }))
    .sort((a, b) => a.year - b.year);

  // Avg lifespan by industry
  const lifespanByIndustry = {};
  autopsies.forEach(a => {
    if (a.industry && a.foundedYear && a.diedYear) {
      const ind = a.industry;
      if (!lifespanByIndustry[ind]) lifespanByIndustry[ind] = { total: 0, count: 0 };
      lifespanByIndustry[ind].total += a.diedYear - a.foundedYear;
      lifespanByIndustry[ind].count++;
    }
  });
  const lifespanData = Object.entries(lifespanByIndustry)
    .map(([ind, { total, count }]) => ({ name: ind, avg: +(total / count).toFixed(1) }))
    .sort((a, b) => b.avg - a.avg);

  const mostMournedCount = autopsies.reduce((max, a) => Math.max(max, a.flowerCount || 0), 0);
  const topIndustry = industriesData[0]?.name || '—';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-zinc-500">
        <div className="animate-pulse text-4xl mb-4">📊</div>
        <p className="text-sm">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">

      <header className="space-y-1">
        <h1 className="font-cinzel text-3xl md:text-4xl text-zinc-100">Coroner's Dashboard</h1>
        <p className="text-zinc-500 text-sm">Aggregate post-mortems across the Startup Graveyard.</p>
      </header>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Autopsies Filed" value={total} sub="Total startups archived" />
        <StatCard label="Avg. Lifespan" value={avgLifespan != null ? `${avgLifespan} yrs` : '—'} sub="Among dated entries" />
        <StatCard label="Top Mourned" value={mostMournedCount > 0 ? `${mostMournedCount} 🌸` : '—'} sub="Flower tributes on one startup" />
        <StatCard label="Top Industry" value={topIndustry} sub="Most failures" />
      </div>

      {total === 0 ? (
        <EmptyState message="No autopsies in the database yet. Search for a failed startup to file the first one." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Top Causes ── */}
          <Section title="Top Causes of Death">
            {causesData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={causesData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: '#27272a55' }} />
                  <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]}>
                    {causesData.map((_, i) => (
                      <Cell key={i} fill={CAUSES_PALETTE[i % CAUSES_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* ── Industries Pie ── */}
          <Section title="Failures by Industry">
            {industriesData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={industriesData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    labelLine={false}
                    label={renderCustomPieLabel}
                  >
                    {industriesData.map((_, i) => (
                      <Cell key={i} fill={INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: '#a1a1aa', fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* ── Avg Lifespan by Industry ── */}
          <Section title="Avg. Lifespan by Industry (years)">
            {lifespanData.length === 0 ? <EmptyState message="Not enough dated entries." /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={lifespanData} margin={{ left: 0, right: 16 }}>
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis tick={{ fill: MUTED, fontSize: 11 }} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: '#27272a55' }} />
                  <Bar dataKey="avg" name="Avg years" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* ── Deaths per Year ── */}
          <Section title="Deaths per Year">
            {deathsPerYear.length === 0 ? <EmptyState message="Not enough dated entries." /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={deathsPerYear} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="year" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="deaths"
                    stroke={GOLD}
                    strokeWidth={2}
                    dot={{ fill: GOLD, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Section>

        </div>
      )}
    </div>
  );
}
