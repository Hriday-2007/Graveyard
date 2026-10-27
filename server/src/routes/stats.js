import { Router } from 'express';
import { Autopsy } from '../models/Autopsy.js';

const router = Router();

/**
 * @route   GET /api/stats/causes
 * @desc    Get counts of startups grouped by causes of death
 * @access  Public
 */
router.get('/causes', async (req, res, next) => {
  try {
    const stats = await Autopsy.aggregate([
      { $unwind: '$causes' },
      {
        $group: {
          _id: '$causes',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          cause: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stats/industries
 * @desc    Get counts of startups grouped by industry
 * @access  Public
 */
router.get('/industries', async (req, res, next) => {
  try {
    const stats = await Autopsy.aggregate([
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          industry: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
