import mongoose from 'mongoose';

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

const timelineEventSchema = new mongoose.Schema(
  {
    date: { type: String, default: '' },
    event: { type: String, required: true },
    sourceUrl: { type: String, default: '' },
  },
  { _id: false }
);

const founderQuoteSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true },
    sourceUrl: { type: String, default: '' },
    attribution: { type: String, default: '' },
  },
  { _id: false }
);

const claimSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    sourceUrl: { type: String, default: '' },
    type: {
      type: String,
      enum: ['founder-stated', 'press-reported', 'inferred'],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const sourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    origin: {
      type: String,
      enum: ['tavily', 'wikipedia', 'hackernews'],
      required: true,
    },
  },
  { _id: false }
);

const autopsySchema = new mongoose.Schema(
  {
    startupName: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    industry: {
      type: String,
      enum: ALLOWED_INDUSTRIES,
      default: 'Other',
    },
    foundedYear: {
      type: Number,
    },
    diedYear: {
      type: Number,
    },
    summary: {
      type: String,
      default: '',
    },
    epitaph: {
      type: String,
      default: '',
    },
    causes: {
      type: [String],
      enum: ALLOWED_CAUSES,
      default: [],
    },
    causeDetails: {
      type: String,
      default: '',
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
    founderQuotes: {
      type: [founderQuoteSchema],
      default: [],
    },
    claims: {
      type: [claimSchema],
      default: [],
    },
    sources: {
      type: [sourceSchema],
      default: [],
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    notFoundReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Autopsy = mongoose.model('Autopsy', autopsySchema);
export default Autopsy;
