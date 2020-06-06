class Lock {
  constructor() {
    this.queues = {};
    this.processing = {};
  }

  acquire(key, callback) {
    let resolver;
    const donePromise = new Promise(resolve => resolver = resolve);

    this.queues[key] = this.queues[key] || [];
    this.queues[key].unshift([callback, resolver]);

    if (!this.processing[key]) this.processQueue(key);
    return donePromise;
  }

  processQueue(key) {
    if (!this.queues[key]) {
      delete this.processing[key];
      return;
    }
    this.processing[key] = true;

    const [callback, resolver] = this.queues[key].pop();
    if (!this.queues[key].length) delete this.queues[key];

    const result = callback(() => this.processQueue(key));
    resolver(result);
  }
}
module.exports = new Lock();


// Some mini sanity check tests.
(async () => {
  return;
  if (process.env.NODE_NEV === 'production') return;
  const lock = module.exports;

  console.log('Acquire 1');
  const a1 = await lock.acquire('test', async (release) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Release 1');
    release();
    return 'Result 1';
  });
  console.log(a1);

  console.log('Acquire 2');
  const a2 = await lock.acquire('test', async (release) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Release 2');
    release();
    return 'Result 2';
  });
  console.log(a2);
})();


