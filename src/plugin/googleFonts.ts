import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";
import * as streams from "../../dep/std/streams.ts";
import * as xxhash from "../../dep/xxhash.ts";

import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";

type Config = {
    type?: "local" | "external";
};

export function googleFonts({ type = "local" }: Config = {}): Plugin {
    return (frugal) => {
        return {
            name: "frugal:googleFonts",
            setup(build) {
                build.onResolve({ filter: /^\/\/fonts.googleapis.com\//, namespace: "https" }, async (args) => {
                    const name = (await xxhash.create()).update(args.path).digest("hex").toString();
                    return {
                        path: `/googlefonts-${name}.css`,
                        namespace: "virtual",
                        pluginData: { url: frugal.url(args).href },
                    };
                });

                if (type === "external") {
                    build.onLoad({ filter: /^\/googlefonts-.*\.css$/, namespace: "virtual" }, async (args) => {
                        const url = args.pluginData.url;
                        if (!url) {
                            return;
                        }

                        const response = await fetch(url, {
                            headers: {
                                "user-agent":
                                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
                            },
                        });

                        const css = await response.text();

                        return { contents: css, loader: "css" };
                    });

                    build.onResolve({ filter: /^\/\/fonts.gstatic.com\//, namespace: "https" }, () => {
                        return { external: true };
                    });
                }

                if (type === "local") {
                    build.onResolve({ filter: /^\/fonts\/.*$/ }, () => {
                        return { external: true };
                    });

                    build.onLoad({ filter: /^\/googlefonts-.*\.css$/, namespace: "virtual" }, async (args) => {
                        const url = args.pluginData.url;
                        if (!url) {
                            return;
                        }

                        const response = await fetch(url, {
                            headers: {
                                "user-agent":
                                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
                            },
                        });
                        let css = await response.text();
                        const urls = css.match(/src\s*:\s*url\((.*?)\)/g);

                        let index = 0;
                        if (urls) {
                            for (const url of urls) {
                                const matched = url.match(/src\s*:\s*url\((.*?)\)/);
                                if (matched) {
                                    const name = (await xxhash.create()).update(matched[1]).digest("hex")
                                        .toString();
                                    const ext = path.extname(matched[1]);

                                    const fontPath = `fonts/${name}${ext}`;
                                    const fontUrl = new URL(fontPath, frugal.config.publicdir);

                                    if (await exists(fontUrl)) {
                                        css = css.replace(matched[1], `/fonts/${name}${ext}`);
                                    } else {
                                        log(`Loading font ${++index} of ${urls.length}`, {
                                            scope: "frugal:googleFonts",
                                            level: "debug",
                                        });
                                        const response = await fetch(matched[1]);
                                        const readableStream = response.body?.getReader();
                                        if (readableStream) {
                                            const reader = streams.readerFromStreamReader(readableStream);

                                            await fs.ensureFile(fontUrl);
                                            const file = await Deno.open(fontUrl, { create: true, write: true });
                                            try {
                                                await streams.copy(reader, file);
                                                css = css.replace(matched[1], `/fonts/${name}${ext}`);
                                            } finally {
                                                file.close();
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        return { contents: css, loader: "css" };
                    });
                }
            },
        };
    };
}

async function exists(path: string | URL) {
    try {
        await Deno.stat(path);
        return true;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return false;
        }

        throw error;
    }
}