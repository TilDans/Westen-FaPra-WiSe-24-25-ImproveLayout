import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from '../inductive-miner-helper';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';

@Injectable({
    providedIn: 'root',
})

export class ExclusiveCutChecker {
    constructor(private helper: InductiveMinerHelper) {}

    // Unterscheidung zwischen Kanten, die aus START kommen und Kanten die in STOP enden:
    // Werden Start-Kanten START A,B und STOP-Kanten C,D an, müssen die Traces im Eventlog auf eine Multiplikation dieser untersucht werden: A..C, A..D, B..C, B..D
    public checkExclusiveCut(eventlog: EventLog, edges: Edge[]): EventLog[] {
        console.log('start checking for an exclusive cut with ', eventlog, edges);
        // Deklaration neuer, geteilter eventlogs
        let A1: EventLog = new EventLog([]);
        let A2: EventLog = new EventLog([]);
    
        // Mappe START-Kanten an STOP-Kanten
        let mappedEdges: [string, string][]  = this.helper.mapEdgesStartToStop(edges);
        let usedEdges: Set<string> = new Set<string>(); // Hilfsvariable, um zu prüfen, ob alle übergebenen Kanten verwendet wurden

        // Prüfe jeden Trace im Eventlog
        for (const cTrace of eventlog.traces) {

            let edgeFound = false; // Tag zum Prüfen, ob eine Kante in einem Trace gefunden wurde
            for (const cEdge of mappedEdges) {
                // Prüfe, ob erstes und letztes Event akt. Trace mit dem akt. mappedEdge übereinstimmt 
                if (cTrace.events[0].conceptName === cEdge[0] && cTrace.events[cTrace.events.length-1].conceptName === cEdge[1]) {
                    // Wenn für akt. Trace der akt. mappedEdge zutrifft, füge ihn A1 hinzu
                    A1.traces.push(cTrace);
                    usedEdges.add(JSON.stringify(cEdge));
                    edgeFound = true
                }
                // Wenn Kante in akt. Trace gefunden, skippe restliche mappedEdges
                if (edgeFound) break;
            }
            // Wenn für akt. Trace keine der mappedEdges zutrifft, füge ihn A2 hinzu
            if (!edgeFound) A2.traces.push(cTrace);
              
        }
        // Wenn einer der Kanten nicht im Eventlog zu finden war, abbrechen:
        const originalEdges: Set<string> = new Set(mappedEdges.map(pair => JSON.stringify(pair))); // Wandle mapped Edges in String um, um Vergleichen zu können
        if (!(usedEdges.size === originalEdges.size && [...usedEdges].every(x => originalEdges.has(x)))) return []; // Konvertiere Kanten zu Set und vergleiche
        
        // Bedingungen prüfen
        // A1 und A2 dürfen keine intersection haben
        if (this.helper.hasIntersection(A1, A2)) return [];
        // A1 und A2 sollten alle events umfassen
        if (!this.helper.isUnion(eventlog, A1, A2)) return [];

        /*
        1. es gibt keine Kante von 𝐴1 nach 𝐴2 in 𝐷
        2. es gibt keine Kante von 𝐴2 nach 𝐴1 in D
        */
        const eventlogMap: Map<string, string[]> = this.helper.parseEventlogToNodes(eventlog); // Map, um Bedingungen prüfen zu können
        // 1.
        for (const cTrace of A1.traces) {
            for (const cEvent of cTrace.events) {
                const reachableActivities = this.helper.getAllReachableActivities(eventlogMap, cEvent);
                if (this.helper.isSubset(reachableActivities, this.helper.parseEventlogToSet(A2))) return []; // Aus A1 darf nichts von A2 erreichbar sein
            }
        }
        // 2.
        for (const cTrace of A2.traces) {
            for (const cEvent of cTrace.events) {
                const reachableActivities = this.helper.getAllReachableActivities(eventlogMap, cEvent);
                if (this.helper.isSubset(reachableActivities, this.helper.parseEventlogToSet(A1))) return []; // Aus A2 darf nichts von A1 erreichbar sein
            }
        }

        // Wenn alle Bedingungen erfolgreich: Returne zwei eventlogs
        return [A1, A2];
    }
}