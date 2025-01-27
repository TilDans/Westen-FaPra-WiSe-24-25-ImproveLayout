import { Injectable } from '@angular/core';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ParallelCutChecker } from './cuts/parallel-cut';

@Injectable({
    providedIn: 'root',
})

export class FallThroughService {
    constructor(
        private helper: InductiveMinerHelper,
        private parallelCutChecker: ParallelCutChecker,
    ){}
    
    public getActivityOncePerTrace(eventlog: EventLog): EventLog[] {
        const uniqueActivities: Set<string> = this.helper.getUniqueActivities(eventlog);
        for (const activity of uniqueActivities) {
            let foundInEventlog: boolean = true;
            for (const cTrace of eventlog.traces) {
                let foundInTrace: boolean = false;

                for (const cEvent of cTrace.events) {
                    if (cEvent.conceptName == activity) {
                        foundInTrace = true;
                        break;
                    }
                }

                if (!foundInTrace) {
                    foundInEventlog = false;
                    break;
                }

            }
            if (foundInEventlog) {
                return this.parallelCutChecker.parallelCutGenerateEventlogs(eventlog, new Set<string>([activity]));
            }
        }
        throw new Error("No ActivityOncePerTrace Fall Through found")
    }
}
