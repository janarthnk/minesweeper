export class BehaviorSubject {
    constructor(value) {
        this._value = value;
        this.subscribers = new Set();
    }
    get value() {
        return this._value;
    }
    next(value) {
        this._value = value;
        this.subscribers.forEach(f => f(value));
    }
    subscribe(func) {
        this.subscribers.add(func);
    }
    // Returns true if value was already in set; otherwise false.
    unsubscribe(func) {
        return this.subscribers.delete(func);
    }
}