import {TestBed} from '@angular/core/testing';
import {TextParserService} from './text-parser.service';
import {EventLog} from '../classes/Datastructure/event-log/event-log';
import {Trace} from '../classes/Datastructure/event-log/trace';
import {TraceEvent} from '../classes/Datastructure/event-log/trace-event';

describe('TextParserService', () => {
    let service: TextParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TextParserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should parse event log string correctly', () => {
        const input = "A B C D+A D B C+B A C D";
        const result: EventLog = service.parse(input);

        expect(result).toBeInstanceOf(EventLog);
        expect(result.traces.length).toBe(3);

        expect(result.traces[0]).toBeInstanceOf(Trace);
        expect(result.traces[0].events.length).toBe(4);
        expect(result.traces[0].events[0]).toBeInstanceOf(TraceEvent);
        expect(result.traces[0].events[0].conceptName).toBe('A');
        expect(result.traces[0].events[1].conceptName).toBe('B');
        expect(result.traces[0].events[2].conceptName).toBe('C');
        expect(result.traces[0].events[3].conceptName).toBe('D');

        expect(result.traces[1].events[0].conceptName).toBe('A');
        expect(result.traces[1].events[1].conceptName).toBe('D');
        expect(result.traces[1].events[2].conceptName).toBe('B');
        expect(result.traces[1].events[3].conceptName).toBe('C');

        expect(result.traces[2].events[0].conceptName).toBe('B');
        expect(result.traces[2].events[1].conceptName).toBe('A');
        expect(result.traces[2].events[2].conceptName).toBe('C');
        expect(result.traces[2].events[3].conceptName).toBe('D');
    });

    it('should parse event log string with spaces and longer names correctly', () => {
        const input = "EventA  EventB  EventC  EventD + EventD   EventB  EventA + EventC   EventA  EventB";
        const result: EventLog = service.parse(input);

        expect(result).toBeInstanceOf(EventLog);
        expect(result.traces.length).toBe(3);

        expect(result.traces[0]).toBeInstanceOf(Trace);
        expect(result.traces[0].events.length).toBe(4);
        expect(result.traces[0].events[0]).toBeInstanceOf(TraceEvent);
        expect(result.traces[0].events[0].conceptName).toBe('EventA');
        expect(result.traces[0].events[1].conceptName).toBe('EventB');
        expect(result.traces[0].events[2].conceptName).toBe('EventC');
        expect(result.traces[0].events[3].conceptName).toBe('EventD');

        expect(result.traces[1].events[0].conceptName).toBe('EventD');
        expect(result.traces[1].events[1].conceptName).toBe('EventB');
        expect(result.traces[1].events[2].conceptName).toBe('EventA');

        expect(result.traces[2].events[0].conceptName).toBe('EventC');
        expect(result.traces[2].events[1].conceptName).toBe('EventA');
        expect(result.traces[2].events[2].conceptName).toBe('EventB');
    });
});
