import {TraceEvent} from "./trace-event";

export class Trace {
    private readonly _events: TraceEvent[]

    constructor(events: TraceEvent[]) {
        this._events = events
    }

    get events(): TraceEvent[] {
        return this._events
    }

}
