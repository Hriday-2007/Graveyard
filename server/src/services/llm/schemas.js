import { z } from 'zod';

export const ALLOWED_INDUSTRIES = [
  'SaaS',
  'Consumer',
  'Fintech',
  'eCommerce',
  'Hardware',
  'Media',
  'Social',
  'Mobility',
  'Health',
  'Education',
  'Other',
];

export const ALLOWED_CAUSES = [
  'no-market-need',
  'ran-out-of-cash',
  'co-founder-conflict',
  'bad-timing',
  'competition',
  'tech-debt',
  'pivoted-too-late',
  'regulatory-legal',
  'poor-unit-economics',
  'scaling-too-fast',
  'acquisition-failed',
  'other',
];

export const TimelineEventSchema = z.object({
  date: z.string().default(''),
  event: z.string(),
  sourceUrl: z.string().default(''),
});

export const FounderQuoteSchema = z.object({
  quote: z.string(),
  sourceUrl: z.string().default(''),
  attribution: z.string().default(''),
});

export const ClaimSchema = z.object({
  text: z.string(),
  sourceUrl: z.string().default(''),
  type: z.enum(['founder-stated', 'press-reported', 'inferred']),
  verified: z.boolean().default(false),
});

export const SourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  origin: z.enum(['tavily', 'wikipedia', 'hackernews']),
});

export const AnalysisSchema = z.object({
  startupName: z.string(),
  industry: z.enum(ALLOWED_INDUSTRIES),
  foundedYear: z.number().int().nullable().optional(),
  diedYear: z.number().int().nullable().optional(),
  summary: z.string(),
  epitaph: z
    .string()
    .describe('A witty but respectful one-liner summary of the startup death, max 15 words'),
  causes: z
    .array(z.enum(ALLOWED_CAUSES))
    .min(1, 'At least 1 cause is required')
    .max(4, 'Maximum of 4 causes allowed'),
  causeDetails: z
    .string()
    .default('')
    .describe('Detailed narrative explanation of the failure causes'),
  timeline: z.array(TimelineEventSchema).default([]),
  founderQuotes: z.array(FounderQuoteSchema).default([]),
  claims: z.array(ClaimSchema).default([]),
  confidence: z.enum(['high', 'medium', 'low']).default('medium'),
  notFoundReason: z.string().nullable().optional(),
});
