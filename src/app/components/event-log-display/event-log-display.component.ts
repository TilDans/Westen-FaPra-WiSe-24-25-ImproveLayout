import {Component, Input} from '@angular/core';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';

@Component({
    selector: 'app-event-log-display',
    templateUrl: './event-log-display.component.html',
    styleUrl: './event-log-display.component.css'
})

export class EventLogDisplayComponent {
    @Input() selectedEventLog?: EventLog;

    updateSelectedEventLog(eventLog: any): void {
        this.selectedEventLog = eventLog;
        console.log('change in display')
    }

    getTraceIndex(trace: Trace): number {
        return (this.selectedEventLog!.traces.indexOf(trace) + 1)
    }

    getFormattedConceptNames(trace: Trace): string {
        return trace.events.map(event => event.conceptName).join('  |   '); // Adjust the number of spaces as needed
    }
}
