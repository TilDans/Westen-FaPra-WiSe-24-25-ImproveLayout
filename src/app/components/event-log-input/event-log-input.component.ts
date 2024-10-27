import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ExampleButtonComponent} from "../example-button/example-button.component";
import {FormsModule} from "@angular/forms";

@Component({
    selector: 'app-event-log-input',
    templateUrl: './event-log-input.component.html',
    standalone: true,
    imports: [
        ExampleButtonComponent,
        FormsModule
    ],
    styleUrl: './event-log-input.component.css'
})
export class EventLogInputComponent {
    inputEventLog = ''

    @Output() eventLogChange = new EventEmitter<string>();

    onButtonClicked() {
        this.eventLogChange.emit(this.inputEventLog);
    }
}
