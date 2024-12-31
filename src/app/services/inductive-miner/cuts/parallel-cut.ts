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

    public checkParallelCut(eventlog: EventLog, edges: Edge[]): EventLog[] {
        // Deklaration neuer, geteilter eventlogs
        let A1: EventLog = new EventLog([]);
        let A2: EventLog = new EventLog([]);

        // Hilfsvariable, um Bidirektionale Verbindungen zu unterscheiden
        let bidirectionalActivities: Set <string> = new Set<string>(); 
        let cutStartEdges: Edge[] = [];
        let cutStopEdges: Edge[] = [];

        // Definiere Liste von markierten Start-/Stop-Knoten
        for (const edge of edges) {
            if (edge.start.id == '' && (edge.end.id)) {
                cutStartEdges.push(edge);
            } 
            if ((edge.start.id) && edge.end.id == '') {
                cutStopEdges.push(edge);
            } 
        }

        // Wenn gar kein Start-Knoten markiert wurde, sofort returnen
        if (cutStartEdges.length == 0) return [];
    
        // Identifiziere Start-Knoten und direkte Verbindungen zu diesem
        let initialActivity: string = cutStartEdges[0].end.id;
        const neighbors: string[] = this.helper.parseEventlogToNodes(eventlog).get(initialActivity) || [];
    
        // Prüfe geschnittene(!) bidirektionale Verbindungen
        for (const neighbor of neighbors) {
            // Zählt die Anzahl der geschnittenen Verbindungen zu einem Knoten. Sind es 2, ist es eine bidirektionale Verbindung.
            let bidirectionalCounter: number = 0;
            //let helperEdge: Edge;
            for (const edge of edges) {
                if ((edge.start.id == initialActivity && edge.end.id == neighbor) || (edge.start.id == neighbor && edge.end.id == initialActivity)) {
                    bidirectionalCounter++;
                    //if (bidirectionalCounter == 1) helperEdge = edge;
                }
                if (bidirectionalCounter == 2) {
                    bidirectionalActivities.add(neighbor); // Knoten ist bidirektional verbunden
                    // // Entferne gefundene bidirektionale Kanten
                    // edges = edges.filter(item => item !== edge) 
                    // edges = edges.filter(item => item !== helperEdge)
                    continue;
                }
            }
        }

        let uniqueActivities = this.helper.getUniqueActivities(eventlog);
        let cutoutActivities = new Set([...uniqueActivities].filter(activity => !bidirectionalActivities.has(activity)));

        for (const cutoutActivity of cutoutActivities) {
            if (cutoutActivity == initialActivity) continue;

            for (const bidirectionalActiviy of bidirectionalActivities) {
                let bidirectionalCounter: number = 0;

                for (const edge of edges) {
                    if ((cutoutActivity == edge.start.id && bidirectionalActiviy == edge.end.id) || (cutoutActivity == edge.end.id && bidirectionalActiviy == edge.start.id) ) {
                        bidirectionalCounter++;
                    }
                    if (bidirectionalCounter == 2) break;
                }

                if (bidirectionalCounter < 2) return []
            }
        }

        // Es müssen korrekte Start- und Stop-Kanten markiert worden sein
        let startActivites: Set<string>  = new Set<string>();
        let stopActivites: Set<string>  = new Set<string>();
        
        // Identifiziere alle Start-/Stop-Kanten, die ausgeschnitten werden sollen
        for (const trace of eventlog.traces) {
            if (cutoutActivities.has(trace.events[0].conceptName)) {
                startActivites.add(trace.events[0].conceptName);
            }
            if (cutoutActivities.has(trace.events[trace.events.length-1].conceptName)) {
                stopActivites.add(trace.events[trace.events.length-1].conceptName);
            }
        }
        // Vergleiche alle tatsächlichen Start-/Stop-kanten mit denen, die markiert wurden 
        const cutStartEdgesSet: Set<string> = new Set(cutStartEdges.map(edge => edge.end.id));
        if (!(startActivites.size === cutStartEdgesSet.size && [...startActivites].every(x => cutStartEdgesSet.has(x)))) return [];

        const cutStopEdgesSet: Set<string> = new Set(cutStopEdges.map(edge => edge.start.id));
        if (!(stopActivites.size === cutStopEdgesSet.size && [...stopActivites].every(x => cutStopEdgesSet.has(x)))) return [];

        // // Entferne Start-/Stop-Kanten, die markiert wurden
        // for (const edge of edges) {
        //     if ((edge.start.id == null && cutoutActivities.has(edge.end.id)) || (edge.end.id == null && cutoutActivities.has(edge.start.id))) {
        //         edges = edges.filter(item => item !== edge) // Entferne gefundene Kante
        //     }
        // }
        // if (edges.length !== 0) return [] // Returne, wenn nicht alle Kanten verwendet wurden


        for (const cTrace of eventlog.traces) {

            let A1Trace: Trace = new Trace([]);
            let A2Trace: Trace = new Trace([]);

            for (const cTraceEvent of cTrace.events) {
                if (bidirectionalActivities.has(cTraceEvent.conceptName)) {
                    A2Trace.events.push(new TraceEvent(cTraceEvent.conceptName));
                } else {
                    A1Trace.events.push(new TraceEvent(cTraceEvent.conceptName));
                }
            }
            A1.traces.push(new Trace(A1Trace.events))
            A2.traces.push(new Trace(A2Trace.events))
        }

        // Bedingungen prüfen
        // A1 und A2 dürfen keine intersection haben
        if (this.helper.hasIntersection(A1, A2)) return [];

        // A1 und A2 sollten alle events umfassen
        if (!this.helper.isUnion(eventlog, A1, A2)) return [];
            
        /* 
        1. für jede Aktivität in 𝐴1 gibt es in 𝐷 eine Kante zu jeder Aktivität in 𝐴2,
        2. für jede Aktivität in 𝐴2 gibt es in 𝐷 eine Kante zu jeder Aktivität in 𝐴1,
        3. für jede Aktivität in 𝐴1 gibt es einen Weg in 𝐷 von 𝑝𝑙𝑎𝑦 über diese Aktivität nach 𝑠𝑡𝑜𝑝, der nur Aktivitäten aus 𝐴1 besucht,
        4. für jede Aktivität in 𝐴2 gibt es einen Weg in 𝐷 von 𝑝𝑙𝑎𝑦 über diese Aktivität nach 𝑠𝑡𝑜𝑝, der nur Aktivitäten aus 𝐴2 besucht.
        */
        
        // 1:
        if (!this.helper.checkDirectNeighbors(eventlog, this.helper.parseEventlogToSet(A1), this.helper.parseEventlogToSet(A2))) return [];
        // 2:
        if (!this.helper.checkDirectNeighbors(eventlog, this.helper.parseEventlogToSet(A2), this.helper.parseEventlogToSet(A1))) return [];
        
        // 3:
        if (this.helper.checkPathInSublog(eventlog, this.helper.parseEventlogToSet(A1))) return [];

        // 4:
        if (this.helper.checkPathInSublog(eventlog, this.helper.parseEventlogToSet(A2))) return [];

        // Wenn alle Bedingungen erfolgreich: Returne zwei eventlogs
        return [A1, A2];
    }
}