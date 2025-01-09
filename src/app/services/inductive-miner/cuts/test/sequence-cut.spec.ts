import {TestBed} from '@angular/core/testing';
import { SequenceCutChecker } from '../sequence-cut';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { TraceEvent } from 'src/app/classes/Datastructure/event-log/trace-event';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { DFGElement } from 'src/app/classes/Datastructure/InductiveGraph/Elements/DFGElement';

describe('Sequence Cut function', () => {
    let service: SequenceCutChecker;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SequenceCutChecker);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return two valid Eventlogs when a sequence cut is made', () => {
        /**
         * ABD
         * ACD
         * ABCD
         * ACBD
         */
        const eventlog: EventLog = new EventLog([ 
                                        new Trace([new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("C"),new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("C"),new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("C"),new TraceEvent("B"),new TraceEvent("D")])
                                    ]);

                                    
        // 1. Sequence cut: A-->
        const edge1: Edge[] = [new Edge(new DFGElement(new TraceEvent("A")), new DFGElement(new TraceEvent("B"))),
                                  new Edge(new DFGElement(new TraceEvent("A")), new DFGElement(new TraceEvent("C")))]

        const resultA: EventLog[] = service.checkSequenceCut(eventlog, edge1);
        expect(resultA.length).toBe(2);

        // Checks for A1
        // Expect every Trace in A1 to be of length "1" and contain only TraceEvent "A"
        for (const cTrace of resultA[0].traces) {
            expect(cTrace.events.length).toBe(1);
            for (const cTraceEvent of cTrace.events) {
                expect(cTraceEvent.conceptName).toBe("A");
            }
        }

        // Checks for A2
        expect(resultA[1].traces[0].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[0].events[1].conceptName).toBe("D")

        expect(resultA[1].traces[1].events[0].conceptName).toBe("C")
        expect(resultA[1].traces[1].events[1].conceptName).toBe("D")

        expect(resultA[1].traces[2].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[2].events[1].conceptName).toBe("C")
        expect(resultA[1].traces[2].events[2].conceptName).toBe("D")

        expect(resultA[1].traces[3].events[0].conceptName).toBe("C")
        expect(resultA[1].traces[3].events[1].conceptName).toBe("B")
        expect(resultA[1].traces[3].events[2].conceptName).toBe("D")
        


        // 2. Sequence cut: B-->D / C-->D
        const edge2: Edge[] = [new Edge(new DFGElement(new TraceEvent("B")), new DFGElement(new TraceEvent("D"))),
                                  new Edge(new DFGElement(new TraceEvent("C")), new DFGElement(new TraceEvent("D")))]

        const resultB: EventLog[] = service.checkSequenceCut(eventlog, edge2);
        expect(resultB.length).toBe(2);

        // Checks for A1
        expect(resultB[0].traces[0].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[0].events[1].conceptName).toBe("B")

        expect(resultB[0].traces[1].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[1].events[1].conceptName).toBe("C")

        expect(resultB[0].traces[2].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[2].events[1].conceptName).toBe("B")
        expect(resultB[0].traces[2].events[2].conceptName).toBe("C")

        expect(resultB[0].traces[3].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[3].events[1].conceptName).toBe("C")
        expect(resultB[0].traces[3].events[2].conceptName).toBe("B")

        // Checks for A2
        // Expect every Trace in A2 to be of length "1" and contain only TraceEvent "D"
        for (const cTrace of resultB[1].traces) {
            expect(cTrace.events.length).toBe(1);
            for (const cTraceEvent of cTrace.events) {
                expect(cTraceEvent.conceptName).toBe("D");
            }
        }
    });

    it('should return empty array when no Sequence Cut was found', () => {


    });
});

