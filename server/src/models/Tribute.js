import mongoose from 'mongoose';

const tributeSchema = new mongoose.Schema(
  {
    autopsyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Autopsy',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    visitorId: {
      type: String,
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['flower', 'candle'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so a visitor only places one tribute of a specific type per autopsy
tributeSchema.index({ autopsyId: 1, visitorId: 1, type: 1 }, { unique: true, sparse: true });

export const Tribute = mongoose.model('Tribute', tributeSchema);
export default Tribute;
