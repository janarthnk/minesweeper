// Second timer
export class Timer {
    constructor() {
        this._seconds = 0;
        this.intervalId = 0;
        this.subscribers = new Map();
    }
    
    start() {
        if (this.intervalId) return; // Already started. If we continue we'll end up overwriting our existing intervalId
        
        this.intervalId = setInterval(() => {
            this.seconds++;
        }, 1000);
    }

    stop() { 
        clearInterval(this.intervalId);
        this.intervalId = 0;
    }

    reset() {
        this.stop();
        this.seconds = 0;
    }

    get seconds() {
        return this._seconds;
    }

    set seconds(s) {
        this._seconds = s;
        this.subscribers.forEach((func) => func(this._seconds));
    }
    /**
     * Subscribes a function `f` to be invoked every second.
     * @param {*} name - a string identifying the function
     * @param {*} f
     */
    subscribe(name, f) {
        this.subscribers.set(name, f);
    }

    clearSubscriptions() {
        this.subscribers = new Set();
    }
}