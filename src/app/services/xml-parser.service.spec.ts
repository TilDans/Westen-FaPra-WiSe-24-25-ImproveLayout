import { TestBed } from '@angular/core/testing';
import { XmlParserService } from './xml-parser.service';
import { EventLog } from '../classes/datastructure/event-log/event-log';
import { Trace } from '../classes/datastructure/event-log/trace';
import { TraceEvent } from '../classes/datastructure/event-log/trace-event';

describe('XmlParserService', () => {
    let service: XmlParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(XmlParserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should parse XML into EventLog', () => {
        const xml = `
            <log>
                <trace>
                    <event>
                        <string key="concept:name" value="Event 1"/>
                    </event>
                    <event>
                        <string key="concept:name" value="Event 2"/>
                    </event>
                </trace>
                <trace>
                    <event>
                        <string key="concept:name" value="Event 3"/>
                    </event>
                </trace>
            </log>
        `;
        const eventLog = service.parseXml(xml);
        expect(eventLog).toBeInstanceOf(EventLog);
        expect(eventLog.traces.length).toBe(2);
        expect(eventLog.traces[0]).toBeInstanceOf(Trace);
        expect(eventLog.traces[0].events.length).toBe(2);
        expect(eventLog.traces[0].events[0]).toBeInstanceOf(TraceEvent);
        expect(eventLog.traces[0].events[0].conceptName).toBe('Event 1');
        expect(eventLog.traces[0].events[1].conceptName).toBe('Event 2');
        expect(eventLog.traces[1].events[0].conceptName).toBe('Event 3');
    });

    it('should throw an error if concept name is undefined', () => {
        const xml = `
            <log>
                <trace>
                    <event>
                        <string key="concept:name"/>
                    </event>
                </trace>
            </log>
        `;
        expect(() => service.parseXml(xml)).toThrowError('Concept name is undefined for element is undefined: [object Element]');
    });
});
