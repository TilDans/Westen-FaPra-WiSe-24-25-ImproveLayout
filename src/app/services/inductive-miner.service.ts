import { Injectable } from '@angular/core';
import { EventLog } from '../classes/event-log/event-log';
import { Trace } from '../classes/event-log/trace';
import { TraceEvent } from '../classes/event-log/trace-event';

@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor() {}

    public applyInductiveMiner(eventLog: EventLog, edges: Trace[]): EventLog[] {
    const splitEventlogs: EventLog[] = this.checkSequenceCut(eventLog, edges); // WIP
    return splitEventlogs;
    //checkExclusiveCut
    //...
    }


  // Aktuell geht man davon aus, dass ein cut in Form eines Arrays von Traces dargestellt wird (also ein eigener eventLog). 
  // Beispiel: cut: Trace[] = ['AB', 'AC'] / cut: Trace[] = ['BD', 'CD']
  private checkSequenceCut(eventLog: EventLog, edges: Trace[]): EventLog[] { // Wir übergeben einen eventlog und einen cut-Vorschlag

    // Deklaration neuer, geteilter eventlogs
    let A1: EventLog = new EventLog([]);
    let A2: EventLog = new EventLog([]);

    var cutPossible: boolean = false; // Abbruchbedingung, wenn in einem Trace keine Kante gefunden wurde
    let usedEdges: Set<Trace> = new Set<Trace>; // Hilfsvariable, um zu prüfen, ob alle übergebenen Kanten verwendet wurden
    const eventlogMap: Map<string, string[]> = this.parseEventlogToNodes(eventLog); // Map, um später Bedingungen prüfen zu können

    for (const cEventLogTrace of eventLog.traces) { // Traversiere durch jeden Trace im eventlog
        cutPossible = false; // Initial ist noch keine Kante im akt. trace im eventlog gefunden
        // Deklaration von traces zum Befüllen geteilter eventlogs
        let A1Trace: Trace = new Trace([]);
        let A2Trace: Trace = new Trace([]);

        for (const cEdge of edges) { // Prüfe jede Kante einzeln
            // Überprüfe, ob akt. Kante im akt. eventlog trace ist

            let indexOfCutInTrace: number = -1; 
            for (let i = 0; i < cEventLogTrace.events.length; i++) {

                if (cEventLogTrace.events[i].conceptName == cEdge.events[0].conceptName && cEventLogTrace.events[i+1].conceptName == cEdge.events[1].conceptName ) {
                    indexOfCutInTrace = i;
                }
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
    let originalEdges: Set<Trace> = new Set(edges);
    if (!(usedEdges.size === originalEdges.size && [...usedEdges].every((x) => originalEdges.has(x)))) return []; // Konvertiere Kanten zu Set und vergleiche

    // Bedingungen prüfen
    // A1 und A2 dürfen keine intersection haben
    if (this.hasIntersection(A1, A2)) return [];

    // A1 und A2 sollten alle events umfassen
    if (!this.isUnion(eventLog, A1, A2)) return [];

    /*
    1. für jede Aktivität in 𝐴1 gibt es in 𝐷 einen Weg zu jeder Aktivität in 𝐴2,
    2. für keine Aktivität in 𝐴2 gibt es in 𝐷 einen Weg zu einer Aktivität in 𝐴1.
    */
    // 1:
    for (const cTrace of A1.traces) {
        for (const cEvent of cTrace.events) {
            const reachableActivities = this.getAllReachableActivities(eventlogMap, cEvent);
            if (!(this.isSubset(reachableActivities, this.parseEventlogToSet(A2)))) return []; // Von allem aus A1 muss alles in A2 erreichbar sein!
        }
    }
    // 2:
    for (const cTrace of A2.traces) {
        for (const cEvent of cTrace.events) {
            const reachableActivities = this.getAllReachableActivities(eventlogMap, cEvent);
            if (this.isSubset(reachableActivities, this.parseEventlogToSet(A1))) return []; // Aus A2 darf nichts von A1 erreichbar sein
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

    // Prüft, ob Set1 Subset von Set2 ist
    private isSubset(set1: Set<string>, set2: Set<string>): boolean {
        // Prüft, ob alle Elemente in set2 auch in set1 vorhanden sind
        return [...set2].every(element => set1.has(element));
    }

    private hasIntersection(A1: EventLog, A2: EventLog): boolean {
        const A1Set: Set<string> = this.parseEventlogToSet(A1);
        const A2Set: Set<string> = this.parseEventlogToSet(A2);

        for (const e of A1Set) {
            if (A2Set.has(e)) {
                return true;
            }
        }
        return false;
    }

    private isUnion(eventlog: EventLog, A1: EventLog, A2: EventLog): boolean {
        const A1Set: Set<string> = this.parseEventlogToSet(A1);
        const A2Set: Set<string> = this.parseEventlogToSet(A2);
        
        const unionA1A2: Set<string>  = new Set([...A1Set, ...A2Set]);
        const uniqueActivities: Set<string>  = this.getUniqueActivities(eventlog);
        if (unionA1A2.size === uniqueActivities.size && [...unionA1A2].every((x) => uniqueActivities.has(x))) return true;
        
        return false
    }

    private parseEventlogToSet(eventlog: EventLog): Set<string> {
        let eventlogSet: Set<string> = new Set();
        for (const trace of eventlog.traces) {
            for (const traceevent of trace.events) {
                eventlogSet.add(traceevent.conceptName); 
            }
        }
        return eventlogSet;
    }

    // Gebe jeden direkten und indirekten Nachfolger eines Events zurück (rekursiv: DFS)
    private getAllReachableActivities(map: Map<string, string[]>, traceEvent: TraceEvent): Set<string> {
        const initialActivity: string = traceEvent.conceptName;
        const reachableActivities: Set<string> = new Set<string>();
        let isInitialActivityReachable: boolean = false;
        
        function dfs(activity: string) {
            if (reachableActivities.has(activity)) return;  // Wenn traceEvent bereits besucht, überspringe 
            reachableActivities.add(activity);
            
            const neighbors = map.get(activity);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (neighbor === initialActivity) {
                        isInitialActivityReachable = true;  // Markiere, wenn der Ausgangszustand erreichbar ist
                    }
                    dfs(neighbor);  // Recursively visit neighbors
                }
            }
        }
        
        dfs(initialActivity);

        // Lösche den initialen Zustand aus den erreichbaren Zuständen, falls er nicht erreichbar ist
        if (!isInitialActivityReachable) {
            reachableActivities.delete(initialActivity);
        }

        return reachableActivities;
    }

    // Wandelt einen eventlog in eine Map vom Typ "Map<string, string[]>" um
    private parseEventlogToNodes(eventlog: EventLog): Map<string, string[]> {
        // Parse zunächst in ein Array von Strings
        let eventlogAsArray: string[] = [];

        for (const trace of eventlog.traces) {
            let helperTrace: string = '';
            for (const traceEvent of trace.events ) {
                helperTrace += traceEvent.conceptName;    
            }
            eventlogAsArray.push(helperTrace);
        };

        // Initialisiere eine Map
        const eventlogMap = new Map<string, string[]>();

        // Iteriere über jede Sequenz im Eventlog
        eventlogAsArray.forEach(trace => {
            // Iteriere über jeden Buchstaben im trace
            for (let i = 0; i < trace.length; i++) {
                const currentEvent = trace[i];

                // Falls das aktuelle Ereignis noch nicht in der Map ist, initialisiere es
                if (!eventlogMap.has(currentEvent)) {
                    eventlogMap.set(currentEvent, []);
                }

                // Falls es ein nachfolgendes Ereignis gibt, füge es der Liste der Transitionen hinzu
                if (i + 1 < trace.length) {
                    const nextEvent = trace[i + 1];
                    const currentTransitions = eventlogMap.get(currentEvent)!;

                    // Nur hinzufügen, wenn es noch nicht vorhanden ist
                    if (!currentTransitions.includes(nextEvent)) {
                        currentTransitions.push(nextEvent);
                    }
                }
            }
        });

        // Sortiere die Listen der Transitionen für konsistente Ausgaben
        eventlogMap.forEach((value, _) => {
            value.sort();
        });

        return eventlogMap;
}

    // Gibt alle einzigartigen Akitivtäten aus einem eventlog zurück
    private getUniqueActivities(eventlog: EventLog): Set<string> {
        const activities = new Set<string>();
        for (const trace of eventlog.traces) {
            trace.events.forEach(traceEvent => activities.add(traceEvent.conceptName));
        }
        return activities;
    }
}