const Queue = require('./queue');
const queue = new Queue();

exports.start = () => {
    queue.init();
    queue.startStreaming();
};

exports.queue = queue;
