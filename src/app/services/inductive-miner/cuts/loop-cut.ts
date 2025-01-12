import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from '../inductive-miner-helper';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { TraceEvent } from 'src/app/classes/Datastructure/event-log/trace-event';

@Injectable({
    providedIn: 'root',
})

export class ParallelCutChecker {
    constructor(private helper: InductiveMinerHelper) {}

    // Zur Aufteilung des Eventlogs (/DFG) in die Teilmengen A1 und A2 wird davon ausgegangen, dass die korrekten Kanten geschnitten wurden
    public checkParallelCut(eventlog: EventLog, edges: Edge[]): EventLog[] {
        // Identifiziere alle START/STOP-Knoten
        let startEdges: Set<string> = new Set();
        let stopEdges: Set<string> = new Set();

        for (const trace of eventlog.traces) {
            startEdges.add(trace.events[0].conceptName)
            stopEdges.add(trace.events[trace.events.length-1].conceptName)
        }

        // Deklaration von Teilmengen
        let A1Play: Set<string> = new Set<string>;
        let A1Stop: Set<string> = new Set<string>;
        let A2Play: Set<string> = new Set<string>;
        let A2Stop: Set<string> = new Set<string>;

        // EventlogMap, um Pfade nachvollziehen zu können
        const eventlogMap: Map<string, string[]> = this.helper.parseEventlogToNodes(eventlog);

        for (const edge of edges) {
            // Identifiziere A1Stop und A2Play Knoten
            if (eventlogMap.get(edge.start.id)?.includes('Stop') ) {
                A1Stop.add(edge.start.id);
                A2Play.add(edge.end.id);
            }

            // Identifiziere A2Stop und A1Play Knoten
            if (startEdges.has(edge.end.id)) { // Wenn es sich um einen Knoten handelt, der aus START kommt
                A2Stop.add(edge.start.id);
                A1Play.add(edge.end.id);
            }
        }

        // Deklaration von Teilmengen A1/A2, um Bedingungen prüfen zu können
        let A1: Set<string> = new Set([...A1Play, ...A1Stop]);
        let A2: Set<string> = new Set([...A2Play, ...A2Stop]);

        // Bedingungen prüfen
        // A1 und A2 dürfen keine intersection haben
        if (this.helper.hasIntersection(A1, A2)) return [];
        // A1 und A2 sollten alle events umfassen
        if (!this.helper.isUnion(eventlog, A1, A2)) return [];
            
        /* 
        1. jede Kante von 𝑝𝑙𝑎𝑦 in 𝐷 führt nach 𝐴1P𝑙𝑎𝑦,
        2. jede Kante nach 𝑠𝑡𝑜𝑝 in 𝐷 kommt aus 𝐴1S𝑡𝑜𝑝,
        3. für jede Aktivität in 𝐴2S𝑡𝑜𝑝 ∪ {𝑝𝑙𝑎𝑦} gibt es in 𝐷 eine Kante zu jeder Aktivität in 𝐴1P𝑙𝑎𝑦,
        4. für jede Aktivität in 𝐴1S𝑡𝑜𝑝 gibt es in 𝐷 eine Kante zu jeder Aktivität in 𝐴2P𝑙𝑎𝑦 ∪ {𝑠𝑡𝑜𝑝}
        */
        
        // 1:
        if (!(startEdges.size === A1Play.size && [...startEdges].every(x => A1Play.has(x)))) return [];
        // 2:
        if (!(stopEdges.size === A1Stop.size && [...stopEdges].every(x => A1Stop.has(x)))) return [];
        
        // 3:
        if (!this.helper.checkDirectNeighbors(eventlog, A2Stop, A1Play)) return []
        // 4:
        if (!this.helper.checkDirectNeighbors(eventlog, A1Stop, A2Play)) return []

        // Deklaration neuer, geteilter eventlogs
        let eventlogA1: EventLog = new EventLog([]);
        let eventlogA2: EventLog = new EventLog([]);

        // Konstruiere die neuen Eventlogs anhand der Teilmengen A1 und A2
        for (const trace of eventlog.traces) {
            let ctraceA1: Trace = new Trace([]);
            let ctraceA2: Trace = new Trace([]);
            
            for (const traceEvent of trace.events) {
                if (A1.has(traceEvent.conceptName)) {
                    ctraceA1.events.push(new TraceEvent(traceEvent.conceptName));
                } else if (A2.has(traceEvent.conceptName)) {
                    ctraceA2.events.push(new TraceEvent(traceEvent.conceptName));
                }
            }
            eventlogA1.traces.push(ctraceA1);
            eventlogA2.traces.push(ctraceA2);
        }

        // Wenn alle Bedingungen erfolgreich: Returne zwei eventlogs
        return [eventlogA1, eventlogA2];
    }

}