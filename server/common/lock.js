class Lock {
  constructor() {
    this.queues = {};
    this.processing = {};
  }

  acquire(key, callback) {
    this.queues[key] = this.queues[key] || [];
    this.queues[key].unshift(callback);
    if (!this.processing[key]) this.processQueue(key);
  }

  processQueue(key) {
    if (!this.queues[key]) {
      delete this.processing[key];
      return;
    }
    this.processing[key] = true;

    const callback = this.queues[key].pop();
    if (!this.queues[key].length) delete this.queues[key];
    callback(() => this.processQueue(key));
  }
}
module.exports = new Lock();