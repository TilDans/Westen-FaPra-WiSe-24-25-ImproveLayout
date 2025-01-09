import {Trace} from "./trace";

export class EventLog {
    private readonly _traces: Trace[]

    constructor(traces: Trace[]) {
        this._traces = traces
    }

    get traces(): Trace[] {
        return this._traces
    }

    public isBaseCase(): boolean {
        // base case when every trace has only one event, and it is the same in all traces
        const firstEvent = this._traces[0].events[0].conceptName
        for (const trace of this._traces) {
            if (trace.events.length > 1) {
                return false
            }
            if (trace.events[0].conceptName !== firstEvent) {
                return false
            }
        }
        return true
    }
}
