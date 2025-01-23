import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ExclusiveCutChecker } from './cuts/exclusive-cut';
import { SequenceCutChecker } from './cuts/sequence-cut';
import { ParallelCutChecker } from './cuts/parallel-cut';
import { LoopCutChecker } from './cuts/loop-cut';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Cuts } from 'src/app/classes/Datastructure/enums';
import { registerLocaleData } from '@angular/common';

@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor(
        private helper: InductiveMinerHelper,
        private exclusiveCutChecker: ExclusiveCutChecker,
        private sequenceCutChecker: SequenceCutChecker,
        private parallelCutChecker: ParallelCutChecker,
        private loopCutChecker: LoopCutChecker
    ) {}

    public applyInductiveMiner(eventlog: EventLog, edges: Edge[]): {el: EventLog[], cutMade: Cuts} {

        const cutCheckers = [
            { checker: this.sequenceCutChecker.checkSequenceCut.bind(this.sequenceCutChecker), cutType: Cuts.Sequence },
            { checker: this.exclusiveCutChecker.checkExclusiveCut.bind(this.exclusiveCutChecker), cutType: Cuts.Exclusive },
            { checker: this.parallelCutChecker.checkParallelCut.bind(this.parallelCutChecker), cutType: Cuts.Parallel },
            { checker: this.loopCutChecker.checkLoopCut.bind(this.loopCutChecker), cutType: Cuts.Loop }
        ];

        for (const { checker, cutType } of cutCheckers) {
            console.log('checking for: ', cutType);
            const splitEventlogs = checker(eventlog, edges);
            if (splitEventlogs.length != 0) {
                return { el: splitEventlogs, cutMade: cutType };
            }
        }
        throw new Error ('no cut possible');
    }

    public checkInductiveMiner(eventlog: EventLog): boolean {
        const uniqueActivities: Set<string> = this.helper.getUniqueActivities(eventlog);

        const cutCheckers = [
            { checker: this.sequenceCutChecker.sequenceCutConditionsChecker.bind(this.sequenceCutChecker) as any, cutType: Cuts.Sequence },
            { checker: this.exclusiveCutChecker.exclusiveCutConditionsChecker.bind(this.exclusiveCutChecker) as any, cutType: Cuts.Exclusive },
            { checker: this.parallelCutChecker.parallelCutConditionsChecker.bind(this.parallelCutChecker) as any, cutType: Cuts.Parallel },
            { checker: this.loopCutChecker.loopCutConditionsChecker.bind(this.loopCutChecker) as any, cutType: Cuts.Loop },
        ];
        
        for (const cutChecker of cutCheckers) {
            let A1: Set<string> = new Set<string>();
            let A2: Set<string> = new Set<string>(uniqueActivities);

            if (cutChecker.cutType == Cuts.Loop ) {
               continue;
            } else {
                for (const activity of uniqueActivities) {
                    if (activity == Array.from(uniqueActivities).pop()) continue;
                    A1.add(activity);
                    A2.delete(activity)
                    const result: EventLog[] = cutChecker.checker(eventlog, A1, A2);
                    console.log("A1: " + Array.from(A1))
                    console.log("A2: " + Array.from(A2))
                    console.log(cutChecker.cutType)
                    console.log("result: " + result.length)
                    if (result.length > 0) return true; // Wenn etwas zurückgegeben wird, ist ein Cut möglich --> Kein Fall Through!
                }
            }
        }
        return false;
    }

}
