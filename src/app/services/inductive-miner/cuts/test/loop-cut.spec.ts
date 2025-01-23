import {TestBed} from '@angular/core/testing';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { TraceEvent } from 'src/app/classes/Datastructure/event-log/trace-event';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { DFGElement } from 'src/app/classes/Datastructure/InductiveGraph/Elements/DFGElement';
import { LoopCutChecker } from '../loop-cut';

describe('Loop Cut function', () => {
    let service: LoopCutChecker;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoopCutChecker);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return two valid Eventlogs when a loop cut is made', () => {
        // Einfachster Eventlog
        /**
         * ABCAB
         * AB
         */
        const eventlog1: EventLog = new EventLog([ 
                                        new Trace([new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("C"),new TraceEvent("A"),new TraceEvent("B")]),
                                        new Trace([new TraceEvent("A"), new TraceEvent("B")]),
                                    ]);
                   
        // Loop Cut: B-->C, C-->A
        const edge1: Edge[] = [
                            new Edge(new DFGElement(new TraceEvent('B')), new DFGElement(new TraceEvent("C"))),
                            new Edge(new DFGElement(new TraceEvent('C')), new DFGElement(new TraceEvent("A"))),
                        ]

        const resultA: EventLog[] = service.checkLoopCut(eventlog1, edge1);
        expect(resultA.length).toBe(2);

        // Checks for A1
        expect(resultA[0].traces[0].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[0].events[1].conceptName).toBe("B")

        expect(resultA[0].traces[1].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[1].events[1].conceptName).toBe("B")

        // Checks for A1
        expect(resultA[1].traces[0].events[0].conceptName).toBe("C")
        
        // Komplexer Loop
        /**
         * ABC DME FABC
         * ABC DME ABC
         * FABG DML FABG
         * FABG DML ABG
         */
        const eventlog2: EventLog = new EventLog([ 
                                    new Trace([new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("C"),new TraceEvent("D"),new TraceEvent("M"),new TraceEvent("E"),new TraceEvent("F"),new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("C")]),
                                    new Trace([new TraceEvent("A"), new TraceEvent("B"),new TraceEvent("C"),new TraceEvent("D"),new TraceEvent("M"),new TraceEvent("E"),new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("C")]),
                                    new Trace([new TraceEvent("F"), new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("G"),new TraceEvent("D"),new TraceEvent("M"),new TraceEvent("L"),new TraceEvent("F"),new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("G")]),
                                    new Trace([new TraceEvent("F"), new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("G"),new TraceEvent("D"),new TraceEvent("M"),new TraceEvent("L"),new TraceEvent("A"),new TraceEvent("B"),new TraceEvent("G")]),
                                ]);

                                    
        // Loop Cut: C-->D, G-->D, E-->A, E-->F, L-->A, L-->F
        const edge2: Edge[] = [
                                new Edge(new DFGElement(new TraceEvent('C')), new DFGElement(new TraceEvent("D"))),
                                new Edge(new DFGElement(new TraceEvent('G')), new DFGElement(new TraceEvent("D"))),
                                new Edge(new DFGElement(new TraceEvent('E')), new DFGElement(new TraceEvent("A"))),
                                new Edge(new DFGElement(new TraceEvent('E')), new DFGElement(new TraceEvent("F"))),
                                new Edge(new DFGElement(new TraceEvent("L")), new DFGElement(new TraceEvent('A'))),
                                new Edge(new DFGElement(new TraceEvent("L")), new DFGElement(new TraceEvent('F'))),
                            ]

        const resultB: EventLog[] = service.checkLoopCut(eventlog2, edge2);
        expect(resultB.length).toBe(2);

        /** Erwartetes Ergebnis:
        A1
        [ 'A', 'B', 'C' ]
        [ 'F', 'A', 'B', 'C' ]
        [ 'A', 'B', 'C' ]
        [ 'A', 'B', 'C' ]
        [ 'F', 'A', 'B', 'G' ]
        [ 'F', 'A', 'B', 'G' ]
        [ 'F', 'A', 'B', 'G' ]
        [ 'A', 'B', 'G' ]
    
        A2
        [ 'D', 'M', 'E' ]
        [ 'D', 'M', 'E' ]
        [ 'D', 'M', 'L' ]
        [ 'D', 'M', 'L' ]
        */
       
        // Checks for A1
        expect(resultB[0].traces[0].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[0].events[1].conceptName).toBe("B")
        expect(resultB[0].traces[0].events[2].conceptName).toBe("C")

        expect(resultB[0].traces[1].events[0].conceptName).toBe("F")
        expect(resultB[0].traces[1].events[1].conceptName).toBe("A")
        expect(resultB[0].traces[1].events[2].conceptName).toBe("B")
        expect(resultB[0].traces[1].events[3].conceptName).toBe("C")

        expect(resultB[0].traces[2].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[2].events[1].conceptName).toBe("B")
        expect(resultB[0].traces[2].events[2].conceptName).toBe("C")

        expect(resultB[0].traces[3].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[3].events[1].conceptName).toBe("B")
        expect(resultB[0].traces[3].events[2].conceptName).toBe("C")

        expect(resultB[0].traces[4].events[0].conceptName).toBe("F")
        expect(resultB[0].traces[4].events[1].conceptName).toBe("A")
        expect(resultB[0].traces[4].events[2].conceptName).toBe("B")
        expect(resultB[0].traces[4].events[3].conceptName).toBe("G")

        expect(resultB[0].traces[5].events[0].conceptName).toBe("F")
        expect(resultB[0].traces[5].events[1].conceptName).toBe("A")
        expect(resultB[0].traces[5].events[2].conceptName).toBe("B")
        expect(resultB[0].traces[5].events[3].conceptName).toBe("G")

        expect(resultB[0].traces[6].events[0].conceptName).toBe("F")
        expect(resultB[0].traces[6].events[1].conceptName).toBe("A")
        expect(resultB[0].traces[6].events[2].conceptName).toBe("B")
        expect(resultB[0].traces[6].events[3].conceptName).toBe("G")

        expect(resultB[0].traces[7].events[0].conceptName).toBe("A")
        expect(resultB[0].traces[7].events[1].conceptName).toBe("B")
        expect(resultB[0].traces[7].events[2].conceptName).toBe("G")

        // Checks for A2
        expect(resultB[1].traces[0].events[0].conceptName).toBe("D")
        expect(resultB[1].traces[0].events[1].conceptName).toBe("M")
        expect(resultB[1].traces[0].events[2].conceptName).toBe("E")

        expect(resultB[1].traces[1].events[0].conceptName).toBe("D")
        expect(resultB[1].traces[1].events[1].conceptName).toBe("M")
        expect(resultB[1].traces[1].events[2].conceptName).toBe("E")

        expect(resultB[1].traces[2].events[0].conceptName).toBe("D")
        expect(resultB[1].traces[2].events[1].conceptName).toBe("M")
        expect(resultB[1].traces[2].events[2].conceptName).toBe("L")

        expect(resultB[1].traces[3].events[0].conceptName).toBe("D")
        expect(resultB[1].traces[3].events[1].conceptName).toBe("M")
        expect(resultB[1].traces[3].events[2].conceptName).toBe("L")


    });

    it('should return empty array when no loop Cut was found', () => {


    });
});

