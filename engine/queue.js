const Fs = require('fs');
const Path = require('path');
const EventEmitter = require('events');
const { PassThrough } = require('stream');

const Throttle = require('throttle');
const { ffprobeSync } = require('@dropb/ffprobe');

const Utils = require('../utils');

class Queue {
    constructor() {
        this._sinks = new Map(); // map of active sinks/writables
        this._songs = []; // list of queued up songs
        this._currentSong = null;
        this.stream = new EventEmitter();
    }

    init() {
        this._songs = Utils.readSongs();
        this._currentSong = Utils.readSong();
    }

    makeResponseSink() {
        const id = Utils.generateRandomId();
        const responseSink = PassThrough();
        this._sinks.set(id, responseSink);
        return { id, responseSink };
    }

    removeResponseSink(id) {
        this._sinks.delete(id);
    }

    _broadcastToEverySink(chunk) {
        for (const [, sink] of this._sinks) {
            sink.write(chunk);
        }
    }

    _getBitRate(song) {
        try {
            const bitRate = ffprobeSync(Path.join(process.cwd(), song)).format
                .bit_rate;
            return parseInt(bitRate);
        } catch (err) {
            return 128000; // reasonable default
        }
    }

    _playLoop() {
        this._currentSong =
            this._songs[Math.floor(Math.random() * this._songs.length)];
        console.log(this._songs, this._currentSong);
        const bitRate = this._getBitRate(this._currentSong);

        const songReadable = Fs.createReadStream(this._currentSong);

        const throttleTransformable = new Throttle(bitRate / 8);
        throttleTransformable.on('data', chunk =>
            this._broadcastToEverySink(chunk)
        );
        throttleTransformable.on('end', () => this._playLoop());

        this.stream.emit('play', this._currentSong);
        songReadable.pipe(throttleTransformable);
    }

    startStreaming() {
        this._playLoop();
    }
}

module.exports = Queue;
