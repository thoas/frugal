import * as fs from '../../dep/std/fs.ts';
import * as log from '../log/mod.ts';

export type CacheData = {
    [s: string]: any;
};

type MemoizeConfig<V> = {
    key: string;
    producer: () => Promise<V> | V;
    otherwise?: () => Promise<void> | void;
};

function logger() {
    return log.getLogger('frugal:Cache');
}

export class Cache<VALUE = unknown> {
    private previousData: CacheData;
    private nextData: CacheData;

    static unserialize(data?: CacheData) {
        if (data === undefined) {
            return new Cache({});
        }
        return new Cache(data);
    }

    constructor(
        previousData: CacheData,
        nextData: CacheData = {},
    ) {
        this.previousData = previousData;
        this.nextData = nextData;
    }

    had(key: string) {
        return key in this.previousData;
    }

    has(key: string) {
        return key in this.nextData;
    }

    async memoize<V = VALUE>(
        { key, producer, otherwise }: MemoizeConfig<V>,
    ): Promise<V> {
        if (!this.has(key)) {
            if (!this.had(key)) {
                this.set<Promise<V>>(
                    key,
                    Promise.resolve(producer()).then((v) => {
                        this.set<V>(key, v);
                        return v;
                    }),
                );
            } else {
                if (otherwise) {
                    await otherwise();
                }
                this.propagate(key);
            }
        } else {
            if (otherwise) {
                await otherwise();
            }
        }

        return Promise.resolve(this.get<Promise<V> | V>(key)!);
    }

    get<V = VALUE>(key: string): V | undefined {
        if (this.has(key)) {
            return this.nextData[key];
        }
        if (this.had(key)) {
            return this.previousData[key];
        }
        return undefined;
    }

    set<V = VALUE>(key: string, value: V) {
        this.nextData[key] = value;
    }

    propagate(key: string) {
        if (this.had(key) && !this.has(key)) {
            this.set(key, this.previousData[key]);
        }
    }

    serialize(): CacheData {
        return this.nextData;
    }
}

export class PersistantCache<VALUE = unknown> extends Cache<VALUE> {
    private cachePath: string;

    static async load(cachePath: string) {
        logger().info({
            cachePath,
            msg() {
                return `loading ${this.cachePath}`;
            },
        });
        try {
            const data = await Deno.readTextFile(cachePath);
            return new PersistantCache(cachePath, JSON.parse(data));
        } catch {
            logger().debug({
                cachePath,
                msg() {
                    return `no cache found at ${this.cachePath}, load pristine cache`;
                },
            });

            return new PersistantCache(cachePath, {});
        }
    }

    constructor(
        cachePath: string,
        previousData: CacheData,
        nextData: CacheData = {},
    ) {
        super(previousData, nextData);
        this.cachePath = cachePath;
    }

    async save(): Promise<void> {
        logger().info({
            cachePath: this.cachePath,
            msg() {
                return `saving ${this.cachePath}`;
            },
        });

        await fs.ensureFile(this.cachePath);
        await Deno.writeTextFile(
            this.cachePath,
            JSON.stringify(this.serialize()),
        );
    }
}
