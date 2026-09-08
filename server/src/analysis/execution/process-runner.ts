import type {
    ChildProcessWithoutNullStreams,
    SpawnOptions,
} from "node:child_process";

export interface ProcessRunner {
    run(
        command: string,
        args: string[],
        options: SpawnOptions,
    ): ChildProcessWithoutNullStreams;
}