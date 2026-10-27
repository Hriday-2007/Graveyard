import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Autopsy } from '../models/Autopsy.js';
import { Tribute } from '../models/Tribute.js';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const startupName = process.argv[2];

if (!startupName || !startupName.trim()) {
  console.error('Usage: npm run reset:autopsy -- "<startupName>"');
  console.error('Example: npm run reset:autopsy -- "Quibi"');
  process.exit(1);
}

const cleanName = startupName.trim();
const normalizedName = cleanName.toLowerCase();

async function resetAutopsy() {
  console.log(`[Reset Autopsy] Connecting to MongoDB...`);
  await connectDB();

  try {
    const existing = await Autopsy.findOne({ normalizedName });

    if (!existing) {
      console.log(`[Reset Autopsy] ℹ️  No autopsy found in MongoDB for "${cleanName}" (normalized: "${normalizedName}").`);
    } else {
      // Delete associated tributes if any
      await Tribute.deleteMany({ autopsyId: existing._id });

      // Delete the autopsy
      const result = await Autopsy.deleteOne({ _id: existing._id });
      console.log(`[Reset Autopsy] ✅ Successfully deleted autopsy for "${existing.startupName}" (ID: ${existing._id}).`);
      console.log(`                Database count deleted: ${result.deletedCount}`);
    }
  } catch (error) {
    console.error(`[Reset Autopsy] ❌ Error deleting autopsy:`, error.message);
  } finally {
    await mongoose.connection.close();
    console.log('[Reset Autopsy] Database connection closed.');
  }
}

resetAutopsy();
