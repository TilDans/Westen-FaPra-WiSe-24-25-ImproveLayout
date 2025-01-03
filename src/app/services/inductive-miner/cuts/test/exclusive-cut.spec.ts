import {TestBed} from '@angular/core/testing';
import { ExclusiveCutChecker } from '../exclusive-cut';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { TraceEvent } from 'src/app/classes/Datastructure/event-log/trace-event';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { DFGElement } from 'src/app/classes/Datastructure/InductiveGraph/Elements/DFGElement';

describe('Exclusive Cut function', () => {
    let service: ExclusiveCutChecker;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ExclusiveCutChecker);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return two valid Eventlogs when a exclusive cut is made', () => {
        /**
         * BD
         * XBD
         * AC
         * AFC
         * AFE
         * AFEC
         * B,D+X,B,D+A,C+A,F,C+A,F,E+A,F,E,C+
         */
        const eventlog: EventLog = new EventLog([ 
                                        new Trace([new TraceEvent("B"),new TraceEvent("D")]),
                                        new Trace([new TraceEvent("X"),new TraceEvent("B"),new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("C")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("F"),new TraceEvent("C")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("F"),new TraceEvent("E")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("F"),new TraceEvent("E"),new TraceEvent("C")])
                                    ]);

                                    
        // 1. Exclusive Cut: -->A, C-->, E-->
        const edge1: Edge[] = [
                                new Edge(new DFGElement(new TraceEvent('')), new DFGElement(new TraceEvent("A"))),
                                new Edge(new DFGElement(new TraceEvent("C")), new DFGElement(new TraceEvent(''))),
                                new Edge(new DFGElement(new TraceEvent("E")), new DFGElement(new TraceEvent('')))]

        const resultA: EventLog[] = service.checkExclusiveCut(eventlog, edge1);
        expect(resultA.length).toBe(2);

        // Checks for A1
        expect(resultA[0].traces[0].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[0].events[1].conceptName).toBe("C")

        expect(resultA[0].traces[1].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[1].events[1].conceptName).toBe("F")
        expect(resultA[0].traces[1].events[2].conceptName).toBe("C")

        expect(resultA[0].traces[2].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[2].events[1].conceptName).toBe("F")
        expect(resultA[0].traces[2].events[2].conceptName).toBe("E")

        expect(resultA[0].traces[3].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[3].events[1].conceptName).toBe("F")
        expect(resultA[0].traces[3].events[2].conceptName).toBe("E")
        expect(resultA[0].traces[3].events[3].conceptName).toBe("C")

        // Checks for A2
        expect(resultA[1].traces[0].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[0].events[1].conceptName).toBe("D")

        expect(resultA[1].traces[1].events[0].conceptName).toBe("X")
        expect(resultA[1].traces[1].events[1].conceptName).toBe("B")
        expect(resultA[1].traces[1].events[2].conceptName).toBe("D")
        


        // 2. Exclusive Cut: -->B, -->X, D-->
        const edge2: Edge[] = [
                                new Edge(new DFGElement(new TraceEvent('')), new DFGElement(new TraceEvent("B"))),
                                new Edge(new DFGElement(new TraceEvent('')), new DFGElement(new TraceEvent("X"))),
                                new Edge(new DFGElement(new TraceEvent("D")), new DFGElement(new TraceEvent('')))]

        const resultB: EventLog[] = service.checkExclusiveCut(eventlog, edge2);
        expect(resultB.length).toBe(2);

         // Checks for A1
         expect(resultA[0].traces[0].events[0].conceptName).toBe("A")
         expect(resultA[0].traces[0].events[1].conceptName).toBe("C")
 
         expect(resultA[0].traces[1].events[0].conceptName).toBe("A")
         expect(resultA[0].traces[1].events[1].conceptName).toBe("F")
         expect(resultA[0].traces[1].events[2].conceptName).toBe("C")
 
         expect(resultA[0].traces[2].events[0].conceptName).toBe("A")
         expect(resultA[0].traces[2].events[1].conceptName).toBe("F")
         expect(resultA[0].traces[2].events[2].conceptName).toBe("E")
 
         expect(resultA[0].traces[3].events[0].conceptName).toBe("A")
         expect(resultA[0].traces[3].events[1].conceptName).toBe("F")
         expect(resultA[0].traces[3].events[2].conceptName).toBe("E")
         expect(resultA[0].traces[3].events[3].conceptName).toBe("C")
 
         // Checks for A2
         expect(resultA[1].traces[0].events[0].conceptName).toBe("B")
         expect(resultA[1].traces[0].events[1].conceptName).toBe("D")
 
         expect(resultA[1].traces[1].events[0].conceptName).toBe("X")
         expect(resultA[1].traces[1].events[1].conceptName).toBe("B")
         expect(resultA[1].traces[1].events[2].conceptName).toBe("D")
    });

    it('should return empty array when no Exclusive Cut was found', () => {


    });
});

