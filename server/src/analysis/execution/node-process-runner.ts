import {
    spawn,
    type ChildProcessWithoutNullStreams,
    type SpawnOptions,
} from "node:child_process";

import type { ProcessRunner } from "./process-runner.js";

export class NodeProcessRunner implements ProcessRunner {
    run(
        command: string,
        args: string[],
        options: SpawnOptions,
    ): ChildProcessWithoutNullStreams {
        return spawn(command, args, options) as ChildProcessWithoutNullStreams;
    }
}