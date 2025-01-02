import {TestBed} from '@angular/core/testing';
import { ExclusiveCutChecker } from '../exclusive-cut';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { TraceEvent } from 'src/app/classes/Datastructure/event-log/trace-event';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { DFGElement } from 'src/app/classes/Datastructure/InductiveGraph/Elements/DFGElement';
import { ParallelCutChecker } from '../parallel-cut';

describe('Exclusive Cut function', () => {
    let service: ParallelCutChecker;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ParallelCutChecker);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return two valid Eventlogs when a parallel cut is made', () => {
        // Eventlog mit >=2 START-Knoten
        /**
         * XC
         * XCB
         * XBC
         * XB
         * BXC
         * B
         * FBC
         * FXC
         * BFXC
         */
        const eventlog1: EventLog = new EventLog([ 
                                        new Trace([new TraceEvent("A"),new TraceEvent("C")]),
                                        new Trace([new TraceEvent("A"), new TraceEvent("C"),new TraceEvent("B")]),
                                        new Trace([new TraceEvent("A"), new TraceEvent("B"),new TraceEvent("C")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("B")]),
                                        new Trace([new TraceEvent("B"),new TraceEvent("A"), new TraceEvent("C")]),
                                        new Trace([new TraceEvent("B")]),
                                        new Trace([new TraceEvent("D"),new TraceEvent("B"), new TraceEvent("C")]),
                                        new Trace([new TraceEvent("D"),new TraceEvent("A"), new TraceEvent("C")]),
                                        new Trace([new TraceEvent("B"), new TraceEvent("D"), new TraceEvent("A"), new TraceEvent("C")])
                                    ]);
                   
        // Parallel Cut: -->A, A-->B, B-->A, C-->B, B-->C, C-->, -->D, D-->B, B-->D
        const edge1: Edge[] = [
                            new Edge(new DFGElement(new TraceEvent('')), new DFGElement(new TraceEvent("A"))),
                            new Edge(new DFGElement(new TraceEvent('A')), new DFGElement(new TraceEvent("B"))),
                            new Edge(new DFGElement(new TraceEvent('B')), new DFGElement(new TraceEvent("A"))),
                            new Edge(new DFGElement(new TraceEvent('C')), new DFGElement(new TraceEvent("B"))),
                            new Edge(new DFGElement(new TraceEvent("B")), new DFGElement(new TraceEvent('C'))),
                            new Edge(new DFGElement(new TraceEvent("C")), new DFGElement(new TraceEvent(''))),
                            new Edge(new DFGElement(new TraceEvent("")), new DFGElement(new TraceEvent('D'))),
                            new Edge(new DFGElement(new TraceEvent("D")), new DFGElement(new TraceEvent('B'))),
                            new Edge(new DFGElement(new TraceEvent("B")), new DFGElement(new TraceEvent('D'))),
                        ]

        const resultA: EventLog[] = service.checkParallelCut(eventlog1, edge1);
        expect(resultA.length).toBe(2);

        // Checks for A1
        expect(resultA[0].traces[0].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[0].events[1].conceptName).toBe("C")

        expect(resultA[0].traces[1].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[1].events[1].conceptName).toBe("C")

        expect(resultA[0].traces[2].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[2].events[1].conceptName).toBe("C")

        expect(resultA[0].traces[3].events[0].conceptName).toBe("A")

        expect(resultA[0].traces[4].events[0].conceptName).toBe("A")
        expect(resultA[0].traces[4].events[1].conceptName).toBe("C")
        
        expect(resultA[0].traces[5].events[0]).toBeUndefined()

        expect(resultA[0].traces[6].events[0].conceptName).toBe("D")
        expect(resultA[0].traces[6].events[1].conceptName).toBe("C")

        expect(resultA[0].traces[7].events[0].conceptName).toBe("D")
        expect(resultA[0].traces[7].events[1].conceptName).toBe("A")
        expect(resultA[0].traces[7].events[2].conceptName).toBe("C")

        expect(resultA[0].traces[8].events[0].conceptName).toBe("D")
        expect(resultA[0].traces[8].events[1].conceptName).toBe("A")
        expect(resultA[0].traces[8].events[2].conceptName).toBe("C")

        // Checks for A2
        expect(resultA[1].traces[0].events[0]).toBeUndefined()
        expect(resultA[1].traces[1].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[2].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[3].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[4].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[5].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[6].events[0].conceptName).toBe("B")
        expect(resultA[1].traces[7].events[0]).toBeUndefined()
        expect(resultA[1].traces[8].events[0].conceptName).toBe("B")
        
        // Eventlog mit >=2 STOP-Knoten
        /**
         * CB
         * CD
         * CDAB
         * CDB
         * CEAB
         * CEB
         * ABCD
         * ABD
         * ABE
         * ACD
         * AD
         * AE
         */
        const eventlog2: EventLog = new EventLog([ 
                                        new Trace([new TraceEvent("C"),new TraceEvent("B")]),
                                        new Trace([new TraceEvent("C"), new TraceEvent("D")]),
                                        new Trace([new TraceEvent("C"), new TraceEvent("D"),new TraceEvent("A"),new TraceEvent("B")]),
                                        new Trace([new TraceEvent("C"),new TraceEvent("D"),new TraceEvent("B")]),
                                        new Trace([new TraceEvent("C"), new TraceEvent("E"),new TraceEvent("A"),new TraceEvent("B")]),
                                        new Trace([new TraceEvent("C"),new TraceEvent("E"), new TraceEvent("B")]),
                                        new Trace([new TraceEvent("A"), new TraceEvent("B"),new TraceEvent("C"),new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("B"), new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("B"), new TraceEvent("E")]),
                                        new Trace([new TraceEvent("A"),new TraceEvent("C"), new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"), new TraceEvent("D")]),
                                        new Trace([new TraceEvent("A"), new TraceEvent("E")]),
                                        new Trace([new TraceEvent("C"),new TraceEvent("A"), new TraceEvent("B")]),
                                    ]);

                                    
        // Parallel Cut: ...
        const edge2: Edge[] = [
                            new Edge(new DFGElement(new TraceEvent('')), new DFGElement(new TraceEvent("C"))),
                            new Edge(new DFGElement(new TraceEvent('A')), new DFGElement(new TraceEvent("C"))),
                            new Edge(new DFGElement(new TraceEvent('C')), new DFGElement(new TraceEvent("A"))),
                            new Edge(new DFGElement(new TraceEvent('C')), new DFGElement(new TraceEvent("B"))),
                            new Edge(new DFGElement(new TraceEvent("B")), new DFGElement(new TraceEvent('C'))),
                            new Edge(new DFGElement(new TraceEvent("D")), new DFGElement(new TraceEvent('A'))),
                            new Edge(new DFGElement(new TraceEvent("A")), new DFGElement(new TraceEvent('D'))),
                            new Edge(new DFGElement(new TraceEvent("D")), new DFGElement(new TraceEvent('B'))),
                            new Edge(new DFGElement(new TraceEvent("B")), new DFGElement(new TraceEvent('D'))),
                            new Edge(new DFGElement(new TraceEvent("E")), new DFGElement(new TraceEvent('A'))),
                            new Edge(new DFGElement(new TraceEvent("A")), new DFGElement(new TraceEvent('E'))),
                            new Edge(new DFGElement(new TraceEvent("E")), new DFGElement(new TraceEvent('B'))),
                            new Edge(new DFGElement(new TraceEvent("B")), new DFGElement(new TraceEvent('E'))),
                            new Edge(new DFGElement(new TraceEvent("D")), new DFGElement(new TraceEvent(''))),
                            new Edge(new DFGElement(new TraceEvent("E")), new DFGElement(new TraceEvent(''))),
                        ]

        const resultB: EventLog[] = service.checkParallelCut(eventlog2, edge2);
        expect(resultB.length).toBe(2);

        // Checks for A1
        expect(resultB[0].traces[0].events[0].conceptName).toBe("C")

        expect(resultB[0].traces[1].events[0].conceptName).toBe("C")
        expect(resultB[0].traces[1].events[1].conceptName).toBe("D")

        expect(resultB[0].traces[2].events[0].conceptName).toBe("C")
        expect(resultB[0].traces[2].events[1].conceptName).toBe("D")

        expect(resultB[0].traces[3].events[0].conceptName).toBe("C")
        expect(resultB[0].traces[3].events[1].conceptName).toBe("D")

        expect(resultB[0].traces[4].events[0].conceptName).toBe("C")
        expect(resultB[0].traces[4].events[1].conceptName).toBe("E")

        expect(resultB[0].traces[5].events[0].conceptName).toBe("C")
        expect(resultB[0].traces[5].events[1].conceptName).toBe("E")

        expect(resultB[0].traces[6].events[0].conceptName).toBe("C")
        expect(resultB[0].traces[6].events[1].conceptName).toBe("D")

        expect(resultB[0].traces[7].events[0].conceptName).toBe("D")

        expect(resultB[0].traces[8].events[0].conceptName).toBe("E")

        expect(resultB[0].traces[9].events[0].conceptName).toBe("C")
        expect(resultB[0].traces[9].events[1].conceptName).toBe("D")

        expect(resultB[0].traces[10].events[0].conceptName).toBe("D")

        expect(resultB[0].traces[11].events[0].conceptName).toBe("E")

        expect(resultB[0].traces[12].events[0].conceptName).toBe("C")

        // Checks for A2
        expect(resultB[1].traces[0].events[0].conceptName).toBe("B")
        
        expect(resultB[1].traces[1].events[0]).toBeUndefined();

        expect(resultB[1].traces[2].events[0].conceptName).toBe("A")
        expect(resultB[1].traces[2].events[1].conceptName).toBe("B")

        expect(resultB[1].traces[3].events[0].conceptName).toBe("B")

        expect(resultB[1].traces[4].events[0].conceptName).toBe("A")
        expect(resultB[1].traces[4].events[1].conceptName).toBe("B")

        expect(resultB[1].traces[5].events[0].conceptName).toBe("B")

        expect(resultB[1].traces[6].events[0].conceptName).toBe("A")
        expect(resultB[1].traces[6].events[1].conceptName).toBe("B")

        expect(resultB[1].traces[7].events[0].conceptName).toBe("A")
        expect(resultB[1].traces[7].events[1].conceptName).toBe("B")

        expect(resultB[1].traces[8].events[0].conceptName).toBe("A")
        expect(resultB[1].traces[8].events[1].conceptName).toBe("B")

        expect(resultB[1].traces[9].events[0].conceptName).toBe("A")

        expect(resultB[1].traces[10].events[0].conceptName).toBe("A")

        expect(resultB[1].traces[11].events[0].conceptName).toBe("A")

        expect(resultB[1].traces[12].events[0].conceptName).toBe("A")
        expect(resultB[1].traces[12].events[1].conceptName).toBe("B")
    });

    it('should return empty array when no Exclusive Cut was found', () => {


    });
});

