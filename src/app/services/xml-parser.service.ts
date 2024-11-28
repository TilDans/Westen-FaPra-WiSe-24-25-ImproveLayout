import {Injectable} from '@angular/core';
import {EventLog} from "../classes/datastructure/event-log/event-log";
import {Trace} from "../classes/datastructure/event-log/trace";
import {TraceEvent} from "../classes/datastructure/event-log/trace-event";

@Injectable({
    providedIn: 'root'
})
export class XmlParserService {

    private readonly parser = new DOMParser()
    eventsInLog = 0;

    constructor() {
    }

    parseXml(xml: string): EventLog {
        const doc = this.parser.parseFromString(xml, 'application/xml')
        const traces = doc.getElementsByTagName('trace')
        const tracesArray = Array.from(traces).map(trace => this.parseTrace(trace))
        console.log('parsed successfully', tracesArray, ' containing ', this.eventsInLog, ' elements')
        return new EventLog(tracesArray)
    }

    private parseTrace(trace: Element): Trace {
        const events = trace.getElementsByTagName('event')
        const eventsArray = Array.from(events).map(event => this.parseEvent(event))
        return new Trace(eventsArray)
    }

    private parseEvent(event: Element): TraceEvent {
        const conceptName = event.querySelector('string[key="concept:name"]')?.getAttribute('value')
        if (!conceptName) {
            throw new Error('Concept name is undefined for element is undefined: ' + event)
        }
        this.eventsInLog++;
        return new TraceEvent(conceptName)
    }

}
