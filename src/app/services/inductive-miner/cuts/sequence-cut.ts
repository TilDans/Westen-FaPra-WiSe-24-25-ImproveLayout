import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from '../inductive-miner-helper';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { Trace } from 'src/app/classes/Datastructure/event-log/trace';
import { TraceEvent } from 'src/app/classes/Datastructure/event-log/trace-event';

@Injectable({
    providedIn: 'root',
})

export class SequenceCutChecker {
    constructor(private helper: InductiveMinerHelper) {}

  public checkSequenceCut(eventlog: EventLog, edges: Edge[]): EventLog[] { // Wir übergeben einen eventlog und einen cut-Vorschlag

    // Bei einem Sequence Cut dürfen keine Kanten aus START oder zu STOP geschnitten werden
    for (const edge of edges) {
        if (edge.start.id == 'play' || edge.end.id == 'stop') return [];
    }

    // Deklaration neuer, geteilter eventlogs
    let A1: EventLog = new EventLog([]);
    let A2: EventLog = new EventLog([]);

    var cutPossible: boolean = false; // Abbruchbedingung, wenn in einem Trace keine Kante gefunden wurde
    let usedEdges: Set<Edge> = new Set<Edge>; // Hilfsvariable, um zu prüfen, ob alle übergebenen Kanten verwendet wurden

    for (const cEventLogTrace of eventlog.traces) { // Traversiere durch jeden Trace im eventlog
        cutPossible = false; // Initial ist noch keine Kante im akt. trace im eventlog gefunden
        // Deklaration von traces zum Befüllen geteilter eventlogs
        let A1Trace: Trace = new Trace([]);
        let A2Trace: Trace = new Trace([]);

        for (const cEdge of edges) { // Prüfe jede Kante einzeln
            // Überprüfe, ob akt. Kante im akt. eventlog trace ist

            let indexOfCutInTrace: number = -1;
            for (let i = 0; i < cEventLogTrace.events.length; i++) {

                //TODO Events i+1 can be out of bounds
                if (cEventLogTrace.events[i+1] ) {
                    if (cEventLogTrace.events[i].conceptName == cEdge.start.id && cEventLogTrace.events[i+1].conceptName == cEdge.end.id ) {
                        indexOfCutInTrace = i;
                    }
                } else break;
            }
            if (indexOfCutInTrace !== -1) { // wenn akt. cut-Vorschlag im akt. eventlog trace gefunden
                cutPossible = true;
                usedEdges.add(cEdge);
                // Fülle den linken Trace
                // Traversiere dafür vom vom Anfang des akt. eventlog-traces bis zum INDEX DES JEWEILIGEN CUTS
                for (let i = 0; i <= indexOfCutInTrace; i++) {
                    A1Trace.events.push(new TraceEvent(cEventLogTrace.events[i].conceptName))
                }

                // Fülle den rechten Trace
                // Traversiere dafür vom INDEX DES JEWEILIGEN CUTS bis zum Ende des akt. eventlog-traces
                for (let i = indexOfCutInTrace+1; i < cEventLogTrace.events.length; i++) {
                    A2Trace.events.push(new TraceEvent(cEventLogTrace.events[i].conceptName))
                }
                // Befülle neue, geteilte eventlogs mit konstruierten traces
                A1.traces.push(A1Trace);
                A2.traces.push(A2Trace)

                break; // Wenn akt. Kante in akt. trace gefunden, können restliche Kanten im akt. trace übersprungen werden
            }

        }; // End-Loop: Cut-Vorschläge
        if (!cutPossible) return []; // Wenn in einem trace keiner der vorgeschlagenen Kanten zu finden war, Loop unterbrechen

    } // End-Loop: Traces in eventlog
    // Wenn einer der Kanten nicht im Eventlog zu finden war, abbrechen:
    const originalEdges: Set<Edge> = new Set(edges);
    if (!(usedEdges.size === originalEdges.size && [...usedEdges].every((x) => originalEdges.has(x)))) return []; // Konvertiere Kanten zu Set und vergleiche

    // Bedingungen prüfen
    // A1 und A2 dürfen keine intersection haben
    if (this.helper.hasIntersection(this.helper.getUniqueActivities(A1), this.helper.getUniqueActivities(A2))) return [];
    // A1 und A2 sollten alle events umfassen
    if (!this.helper.isUnion(eventlog, this.helper.getUniqueActivities(A1), this.helper.getUniqueActivities(A2))) return [];
    
    /*
    1. für jede Aktivität in 𝐴1 gibt es in 𝐷 einen Weg zu jeder Aktivität in 𝐴2,
    2. für keine Aktivität in 𝐴2 gibt es in 𝐷 einen Weg zu einer Aktivität in 𝐴1.
    */
    const eventlogMap: Map<string, string[]> = this.helper.parseEventlogToNodes(eventlog); // Map, um später Bedingungen prüfen zu können
    // 1:
    for (const cTrace of A1.traces) {
        for (const cEvent of cTrace.events) {
            const reachableActivities = this.helper.getAllReachableActivities(eventlogMap, cEvent);
            if (!(this.helper.isSubset(reachableActivities, this.helper.getUniqueActivities(A2)))) return []; // Von allem aus A1 muss alles in A2 erreichbar sein!
        }
    }
    // 2:
    for (const cTrace of A2.traces) {
        for (const cEvent of cTrace.events) {
            const reachableActivities = this.helper.getAllReachableActivities(eventlogMap, cEvent);
            if (this.helper.isSubset(reachableActivities, this.helper.getUniqueActivities(A1))) return []; // Aus A2 darf nichts von A1 erreichbar sein
        }
    }
    // // FINALE EVENTLOGS
    // for (const a of A1.traces) {
    //     let x: string[] = []
    //     for (const b of a.events) {
    //         x.push(b.conceptName);
    //     }
    //     console.log(x)
    // }
    // for (const a of A2.traces) {
    //     let x: string[] = []
    //     for (const b of a.events) {
    //         x.push(b.conceptName);
    //     }
    //     console.log(x)
    // }

    // Wenn alle Bedingungen erfolgreich: Returne zwei eventlogs
    return [A1, A2];
    }
}
