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
        this._currentSong = this._songs.length
            ? this.removeFromQueue({ fromTop: true })
            : this._currentSong;
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

    _boxChildrenIndexToSongsIndex(index) {
        // converts index of this.box.children array (view layer)
        // to the index of this._songs array (stream layer)
        return index - 1;
    }

    _createAndAppendToSongs(song) {
        this._songs.push(song);
    }

    createAndAppendToQueue(song) {
        this._createAndAppendToSongs(song);
    }

    _removeFromSongs(index) {
        const adjustedIndex = this._boxChildrenIndexToSongsIndex(index);
        return this._songs.splice(adjustedIndex, 1);
    }

    removeFromQueue({ fromTop } = {}) {
        const index = fromTop ? 1 : this._focusIndexer.get();
        const [song] = this._removeFromSongs(index);
        return song;
    }
}

module.exports = Queue;
