import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {Component, Input} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-event-log-display',
    templateUrl: './event-log-display.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDividerModule,
        FormsModule,
        MatIconModule
    ],
    styleUrl: './event-log-display.component.css'
})

export class EventLogDisplayComponent {
    @Input() selectedEventLog?: EventLog;
    constructor(private snackBar: MatSnackBar) {} // Inject MatSnackBar

    copyEventLog() {
        let eventLogString = '';
        const selected = this.selectedEventLog;
        let displayedWarning = false;
        if (selected) {
            for (const trace of selected.traces) {
                for (const event of trace.events) {
                    if (!displayedWarning && event.conceptName.includes(" ")) {
                        this.snackBar.open(
                            'Spaces in the Event Log were removed to ensure compatibility with the text input area.', 
                            'Close', 
                            { duration: 3000 } // Message will auto-dismiss after 3 seconds
                        );
                        displayedWarning = true;
                    }
                    const cleanedConceptName = event.conceptName.replace(/\s+/g, '');
                    eventLogString = eventLogString.concat(cleanedConceptName, " ");    
                }
                eventLogString = eventLogString.concat("+");
            }
        }
        navigator.clipboard.writeText(eventLogString).then(
        () => {
            if(!displayedWarning) {
                this.snackBar.open('EventLog copied to clipboard!', 'Close', {
                duration: 3000, // Success message auto-dismiss
                });
            }
        },
        () => {
            this.snackBar.open('Failed to copy EventLog to clipboard.', 'Close', {
            duration: 3000, // Error message auto-dismiss
            });
        }
        );
        return true;
    }


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
