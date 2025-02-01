import {Injectable} from '@angular/core';
import {EventLog} from '../classes/Datastructure/event-log/event-log';
import {Trace} from '../classes/Datastructure/event-log/trace';
import {TraceEvent} from '../classes/Datastructure/event-log/trace-event';
import { sequence } from '@angular/animations';

@Injectable({
    providedIn: 'root'
})
export class TextParserService {

    constructor() {
    }

    parse(eventLog: string): EventLog {
        // remove all duplicate spaces
        const sequences = eventLog.split('+');
        eventLog = eventLog.replace(/\s+/g, ' ');

        const traces = sequences.filter(sequence => sequence.length > 0).map(trace => {
            const events = trace.split(' ').filter(trace => trace.length > 0).map(eventName => new TraceEvent(eventName.trim()));
            return new Trace(events);
        });
        return new EventLog(traces.filter(trace => trace.events[0].conceptName != ""));
    }
}
