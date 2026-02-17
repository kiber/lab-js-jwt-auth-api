class RateLimitStore {
  // eslint-disable-next-line class-methods-use-this
  async increment() {
    throw new Error('RateLimitStore.increment must be implemented');
  }
}

module.exports = RateLimitStore;
