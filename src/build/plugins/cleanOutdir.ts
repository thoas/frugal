import * as path from "../../../dep/std/path.ts";
import * as esbuild from "../../../dep/esbuild.ts";

import { FrugalConfig } from "../../Config.ts";
import { log } from "../../log.ts";

export function cleanOutdir(config: FrugalConfig): esbuild.Plugin {
    return {
        name: "__frugal_internal:cleanOutdir",
        setup(build) {
            let isFirstBuild = true;

            const initialOptions = build.initialOptions;
            const cwd = path.toFileUrl(initialOptions.absWorkingDir ?? Deno.cwd());
            const outdir = initialOptions.outdir ?? ".";
            const outdirURL = new URL(outdir, cwd);

            build.onStart(async () => {
                if (!isFirstBuild) {
                    return;
                }

                try {
                    log(
                        `clean ${
                            path.relative(path.fromFileUrl(new URL(".", config.self)), path.fromFileUrl(outdirURL))
                        }`,
                        {
                            level: "debug",
                            scope: "cleanOutdir",
                        },
                    );

                    await Deno.remove(outdirURL, {
                        recursive: true,
                    });
                } catch (error) {
                    if (!(error instanceof Deno.errors.NotFound)) {
                        throw error;
                    }
                }

                isFirstBuild = false;
            });
        },
    };
}
