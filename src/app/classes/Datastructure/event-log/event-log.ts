import {Trace} from "./trace";

export class EventLog {
    private readonly _traces: Trace[]

    constructor(traces: Trace[]) {
        let uniqueTraces: Trace[] = [];
        let seenTraces = new Set<string>();
    
        traces.forEach(trace => {
            // Create a unique string representation of the trace's events
            let eventSignature = trace.events.map(event => event.conceptName).join(",");
    
            if (!seenTraces.has(eventSignature)) {
                seenTraces.add(eventSignature);
                uniqueTraces.push(trace);
            }
        });
    
        this._traces = uniqueTraces;
    }
    

    get traces(): Trace[] {
        return this._traces
    }

    public isBaseCase(): boolean {
        // base case when every trace has only one event, and it is the same in all traces
        const firstEvent = this._traces[0].events[0].conceptName;
        
        for (const trace of this._traces) {
            for (const event of trace.events) {
                if (event.conceptName !== firstEvent) {
                    return false;
                }
            }
        }
        return true;
    }
}
