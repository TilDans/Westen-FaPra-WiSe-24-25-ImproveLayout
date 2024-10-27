import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import { EventLog } from '../classes/event-log/event-log';
import {Diagram} from '../classes/diagram/diagram';

@Injectable({
    providedIn: 'root'
})
export class DisplayService implements OnDestroy {

    private _eventLog$: BehaviorSubject<EventLog>;

    constructor() {
        this._eventLog$ = new BehaviorSubject<EventLog>(new EventLog([]));
    }

    ngOnDestroy(): void {
        this._eventLog$.complete();
    }

    public get eventLog$(): Observable<EventLog> {
        return this._eventLog$.asObservable();
    }

    public get eventLog(): EventLog {
        return this._eventLog$.getValue();
    }

    public display(log: EventLog) {
        this._eventLog$.next(log);
    }
}
