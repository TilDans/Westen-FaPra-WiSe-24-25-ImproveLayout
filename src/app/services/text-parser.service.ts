import {Injectable} from '@angular/core';
import {EventLog} from '../classes/Datastructure/event-log/event-log';
import {Trace} from '../classes/Datastructure/event-log/trace';
import {TraceEvent} from '../classes/Datastructure/event-log/trace-event';

@Injectable({
    providedIn: 'root'
})
export class TextParserService {

    constructor() {
    }

    parse(eventLog: string): EventLog {
        // remove all duplicate spaces
        const sequences = eventLog.split('+');
        console.log(sequences);

        const traces = sequences.filter(element => element.length > 0).map(sequence => {
            eventLog = eventLog.replace(/\s+/g, ' ');
            const events = sequence.split(' ')
                .filter(el => el.length > 0)
                .map(eventName => new TraceEvent(eventName.trim()));
            return new Trace(events);
        });
        console.log(traces);
        return new EventLog(traces);
    }
}
