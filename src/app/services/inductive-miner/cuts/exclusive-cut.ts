

import { EventLog } from 'src/app/classes/event-log/event-log';
import { TraceEvent } from 'src/app/classes/event-log/trace-event';
import { InductiveMinerHelper } from '../inductive-miner-helper';

export class ExclusiveCutChecker {
    constructor(private helper: InductiveMinerHelper) {}

    // Unterscheidung zwischen Kanten, die START sind und Kanten die STOP sind:
    // Gibt der Nutzer 1 START A und 2 STOP B, C an, muss die Aufteilung anhand von AB, AC entstehen. Sie werden also multipliziert
    // Dafür muss vorher geprüft werden, welche dieser START und welche STOP zugehörig sind: Schreibe zwei Funktionen, die das prüfen und ordne zu.
    public checkExclusiveCut(eventlog: EventLog, edges: TraceEvent[]): EventLog[] {
        // Deklaration neuer, geteilter eventlogs
        let A1: EventLog = new EventLog([]);
        let A2: EventLog = new EventLog([]);
    
        for (const cTrace of eventlog.traces) {
            
            if (cTrace.events[0].conceptName == edges[0].conceptName && cTrace.events[cTrace.events.length-1].conceptName == edges[1].conceptName) {
                A2.traces.push(cTrace);
            } else {
                A1.traces.push(cTrace);
            }
        
        }
    
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