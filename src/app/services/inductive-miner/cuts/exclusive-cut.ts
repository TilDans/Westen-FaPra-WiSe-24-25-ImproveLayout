import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from '../inductive-miner-helper';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { TraceEvent } from 'src/app/classes/Datastructure/event-log/trace-event';

@Injectable({
    providedIn: 'root',
})

export class ExclusiveCutChecker {
    constructor(private helper: InductiveMinerHelper) {}

    // Unterscheidung zwischen Kanten, die aus PLAY kommen und Kanten die in STOP enden:
    // Werden PLAY-Kanten A,B und STOP-Kanten C,D an, müssen die Traces im Eventlog auf eine Multiplikation dieser untersucht werden: A..C, A..D, B..C, B..D
    public checkExclusiveCut(eventlog: EventLog, edges: Edge[]): EventLog[] {
        // Deklaration neuer, geteilter eventlogs
        let eventlogA1: EventLog = new EventLog([]);
        let eventlogA2: EventLog = new EventLog([]);
    
        // Mappe PLAY-Kanten an STOP-Kanten
        let mappedEdges: [string, string][]  = this.helper.mapEdgesPlayToStop(edges);
        let usedEdges: Set<string> = new Set<string>(); // Hilfsvariable, um zu prüfen, ob alle übergebenen Kanten verwendet wurden

        // Prüfe jeden Trace im Eventlog
        for (const cTrace of eventlog.traces) {

            let edgeFound = false; // Tag zum Prüfen, ob eine Kante in einem Trace gefunden wurde
            for (const cEdge of mappedEdges) {
                // Prüfe, ob erstes und letztes Event des akt. Trace mit dem akt. mappedEdge übereinstimmt 
                if (cTrace.events[0].conceptName === cEdge[0] && cTrace.events[cTrace.events.length-1].conceptName === cEdge[1]) {
                    // Wenn für akt. Trace der akt. mappedEdge zutrifft, füge ihn A1 hinzu
                    eventlogA1.traces.push(cTrace);
                    usedEdges.add(JSON.stringify(cEdge));
                    edgeFound = true
                }
                // Wenn Kante in akt. Trace gefunden, skippe restliche mappedEdges
                if (edgeFound) break;
            }
            // Wenn für akt. Trace keine der mappedEdges zutrifft, füge ihn A2 hinzu
            if (!edgeFound) eventlogA2.traces.push(cTrace);
              
        }
        // Wenn einer der Kanten nicht im Eventlog zu finden war, abbrechen:
        const originalEdges: Set<string> = new Set(mappedEdges.map(pair => JSON.stringify(pair))); // Wandle mapped Edges in String um, um Vergleichen zu können
        if (!(usedEdges.size === originalEdges.size && [...usedEdges].every(x => originalEdges.has(x)))) return []; // Konvertiere Kanten zu Set und vergleiche
        
        // Es dürfen nur PLAY/STOP-Kanten markiert worden sein
        for (const cEdge of edges) {
            if (cEdge.start.id != 'play' && cEdge.end.id != 'stop') {
                return []
            }
        }

        // Prüfe Bedingungen
        return this.exclusiveCutConditionsChecker(eventlog, this.helper.getUniqueActivities(eventlogA1), this.helper.getUniqueActivities(eventlogA2), {A1: eventlogA1, A2: eventlogA2});
    }

    public exclusiveCutConditionsChecker(eventlog: EventLog, A1: Set<string>, A2: Set<string>, splitEventlogs?: {A1: EventLog, A2: EventLog}): EventLog[] {
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
        for (const cActivity of A1) {
            const reachableActivities = this.helper.getAllReachableActivities(eventlogMap, cActivity);
            if (this.helper.isSubset(reachableActivities, A2)) return []; // Aus A1 darf nichts von A2 erreichbar sein
        }
        // 2.
        for (const cActivity of A2) {
            const reachableActivities = this.helper.getAllReachableActivities(eventlogMap, cActivity);
            if (this.helper.isSubset(reachableActivities, A1)) return []; // Aus A2 darf nichts von A1 erreichbar sein
        }

        // Falls diese Methode von der fallThrough-Funktion aufgerufen wurde, ist die "echte" Generierung eines eventlogs irrelevant
        // Länge muss != 0 sein
        if (splitEventlogs === undefined) {
            return [new EventLog([new Trace([new TraceEvent('Fall Through found')])])]
        }

        // Wenn alle Bedingungen erfolgreich: Returne zwei eventlogs
        return [splitEventlogs.A1, splitEventlogs.A2];
    }
}