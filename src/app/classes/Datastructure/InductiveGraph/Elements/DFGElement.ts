import { TraceEvent } from "../../event-log/trace-event";
import { CustomElement } from "./element";

export class DFGElement extends CustomElement {
    private _traceEvent?: TraceEvent;

    constructor(traceEvent: TraceEvent) {
        super();
        this.id = traceEvent.conceptName;
        this._traceEvent = traceEvent;
    }

    get traceEvent(): TraceEvent {
        if (this._traceEvent) {
            return this._traceEvent;
        } else throw Error("no trace event");
    }

    set traceEvent(event: TraceEvent) {
        this._traceEvent = event;
    }

}