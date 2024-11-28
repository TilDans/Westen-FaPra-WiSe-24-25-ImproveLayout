import { EventLog } from "src/app/classes/event-log/event-log";
import { TraceEvent } from "src/app/classes/event-log/trace-event";


export class InductiveMinerHelper {
    
    // Prüft, ob Set1 Subset von Set2 ist
    public isSubset(set1: Set<string>, set2: Set<string>): boolean {
        // Prüft, ob alle Elemente in set2 auch in set1 vorhanden sind
        return [...set2].every(element => set1.has(element));
    }

    public hasIntersection(A1: EventLog, A2: EventLog): boolean {
        const A1Set: Set<string> = this.parseEventlogToSet(A1);
        const A2Set: Set<string> = this.parseEventlogToSet(A2);

        for (const e of A1Set) {
            if (A2Set.has(e)) {
                return true;
            }
        }
        return false;
    }

    public isUnion(eventlog: EventLog, A1: EventLog, A2: EventLog): boolean {
        const A1Set: Set<string> = this.parseEventlogToSet(A1);
        const A2Set: Set<string> = this.parseEventlogToSet(A2);
        
        const unionA1A2: Set<string>  = new Set([...A1Set, ...A2Set]);
        const uniqueActivities: Set<string>  = this.getUniqueActivities(eventlog);
        if (unionA1A2.size === uniqueActivities.size && [...unionA1A2].every((x) => uniqueActivities.has(x))) return true;
        
        return false
    }

    public parseEventlogToSet(eventlog: EventLog): Set<string> {
        let eventlogSet: Set<string> = new Set();
        for (const trace of eventlog.traces) {
            for (const traceevent of trace.events) {
                eventlogSet.add(traceevent.conceptName); 
            }
        }
        return eventlogSet;
    }

    // Gebe jeden direkten und indirekten Nachfolger eines Events zurück (rekursiv: DFS)
    public getAllReachableActivities(map: Map<string, string[]>, traceEvent: TraceEvent): Set<string> {
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
    public parseEventlogToNodes(eventlog: EventLog): Map<string, string[]> {
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
    public getUniqueActivities(eventlog: EventLog): Set<string> {
        const activities = new Set<string>();
        for (const trace of eventlog.traces) {
            trace.events.forEach(traceEvent => activities.add(traceEvent.conceptName));
        }
        return activities;
    }
}