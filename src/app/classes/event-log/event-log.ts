import {Trace} from "./trace";

export class EventLog {
    private readonly _traces: Trace[]

    constructor(traces: Trace[]) {
        this._traces = traces
    }

    get traces(): Trace[] {
        return this._traces
    }
}
