import { Router } from 'express';
import mongoose from 'mongoose';
import { Autopsy } from '../models/Autopsy.js';
import { Tribute } from '../models/Tribute.js';

const router = Router();

/**
 * @route   GET /api/autopsies/filters
 * @desc    Get distinct industries and causes from stored autopsies
 * @access  Public
 */
router.get('/filters', async (req, res, next) => {
  try {
    const [rawIndustries, rawCauses] = await Promise.all([
      Autopsy.distinct('industry'),
      Autopsy.distinct('causes'),
    ]);

    const industries = rawIndustries.filter(Boolean).sort();
    const causes = rawCauses.filter(Boolean).sort();

    res.json({ industries, causes });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/autopsies
 * @desc    Get list of autopsies with search, filter, sort, and pagination
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const { q, industry, cause, sort = 'flowers' } = req.query;

    const query = {};

    // Search query (startupName or summary)
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [{ startupName: regex }, { normalizedName: regex }, { summary: regex }];
    }

    // Industry filter
    if (industry && industry !== 'all') {
      query.industry = industry;
    }

    // Cause filter
    if (cause && cause !== 'all') {
      query.causes = cause;
    }

    // Aggregation pipeline to include flowerCount
    const pipeline = [
      { $match: query },
      // Lookup flowers
      {
        $lookup: {
          from: 'tributes',
          let: { autopsyId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$autopsyId', '$$autopsyId'] },
                    { $eq: ['$type', 'flower'] },
                  ],
                },
              },
            },
          ],
          as: 'flowerDocs',
        },
      },
      {
        $addFields: {
          flowerCount: { $size: '$flowerDocs' },
        },
      },
      {
        $project: {
          flowerDocs: 0,
        },
      },
    ];

    // Sorting
    if (sort === 'recent') {
      pipeline.push({ $sort: { diedYear: -1, createdAt: -1 } });
    } else if (sort === 'new') {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else {
      // Default: flowers
      pipeline.push({ $sort: { flowerCount: -1, createdAt: -1 } });
    }

    // Total count before pagination
    const countResult = await Autopsy.countDocuments(query);

    // Apply pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const autopsies = await Autopsy.aggregate(pipeline);

    res.json({
      autopsies,
      page,
      pages: Math.ceil(countResult / limit) || 1,
      total: countResult,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/autopsies/:id
 * @desc    Get single autopsy details with flowerCount and flowered status
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Autopsy not found' });
    }

    const autopsy = await Autopsy.findById(id).lean();
    if (!autopsy) {
      return res.status(404).json({ success: false, message: 'Autopsy not found' });
    }

    const visitorId = req.headers['x-visitor-id'];
    const [flowerCount, userTribute] = await Promise.all([
      Tribute.countDocuments({ autopsyId: id, type: 'flower' }),
      visitorId ? Tribute.findOne({ autopsyId: id, visitorId, type: 'flower' }) : null,
    ]);

    res.json({
      ...autopsy,
      flowerCount,
      flowered: Boolean(userTribute),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/autopsies/:id/flower
 * @desc    Get flower count and status for an autopsy
 * @access  Public
 */
router.get('/:id/flower', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid autopsy ID' });
    }

    const visitorId = req.headers['x-visitor-id'];
    const [flowerCount, userTribute] = await Promise.all([
      Tribute.countDocuments({ autopsyId: id, type: 'flower' }),
      visitorId ? Tribute.findOne({ autopsyId: id, visitorId, type: 'flower' }) : null,
    ]);

    res.json({
      flowered: Boolean(userTribute),
      flowerCount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/autopsies/:id/flower
 * @desc    Toggle flower tribute on an autopsy
 * @access  Public
 */
router.post('/:id/flower', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Invalid autopsy ID' });
    }

    const visitorId = req.headers['x-visitor-id'] || 'anonymous-visitor';

    const existing = await Tribute.findOne({ autopsyId: id, visitorId, type: 'flower' });

    let flowered = false;
    if (existing) {
      // Toggle off
      await Tribute.deleteOne({ _id: existing._id });
      flowered = false;
    } else {
      // Lay a flower
      await Tribute.create({
        autopsyId: id,
        visitorId,
        type: 'flower',
      });
      flowered = true;
    }

    const flowerCount = await Tribute.countDocuments({ autopsyId: id, type: 'flower' });

    res.json({
      flowered,
      flowerCount,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
