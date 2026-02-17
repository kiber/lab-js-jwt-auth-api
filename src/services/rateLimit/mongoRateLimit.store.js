const RateLimitCounter = require('../../models/RateLimitCounter');
const RateLimitStore = require('./rateLimit.store');

class MongoRateLimitStore extends RateLimitStore {
  async increment(key, windowMs) {
    const now = new Date();
    const existing = await RateLimitCounter.findOne({ key });

    if (!existing || existing.expiresAt <= now) {
      const expiresAt = new Date(Date.now() + windowMs);
      const updated = await RateLimitCounter.findOneAndUpdate(
        { key },
        { $set: { count: 1, expiresAt } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return {
        count: updated.count,
        resetAt: updated.expiresAt
      };
    }

    const updated = await RateLimitCounter.findOneAndUpdate(
      { key, expiresAt: { $gt: now } },
      { $inc: { count: 1 } },
      { new: true }
    );

    if (!updated) {
      return this.increment(key, windowMs);
    }

    return {
      count: updated.count,
      resetAt: updated.expiresAt
    };
  }
}

module.exports = MongoRateLimitStore;
