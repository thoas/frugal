import * as log from '../log/mod.ts';
import { PageRegenerator } from './PageRegenerator.ts';
import { CleanConfig } from './Config.ts';
import { FrugalContext } from './FrugalContext.ts';
import { StaticPage } from './Page.ts';

function logger() {
    return log.getLogger('frugal:Regenerator');
}

export class Regenerator {
    private config: CleanConfig;
    private context: FrugalContext;
    private regenerators: PageRegenerator<any, any>[];

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config;
        this.context = context;
        this.regenerators = this.context.pages.filter(page => page instanceof StaticPage).map((page) => {
            return new PageRegenerator(page, {
                cache: this.context.cache,
                context: this.context.pageContext,
                publicDir: this.config.publicDir,
            });
        });
    }

    get routes() {
        return this.regenerators.map(regenerator => regenerator.route)
    }

    async regenerate(pathname: string): Promise<boolean> {
        this.config.setupServerLogging();

        logger().info({
            op: 'start',
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `regeneration of ${pathname}`,
            },
        });

        const pageRegenerator = this.getMatchingPageRegenerator(
            pathname,
        );

        if (pageRegenerator === undefined) {
            logger().info({
                pathname,
                msg() {
                    return `no match found for ${this.pathname}`;
                },
                logger: {
                    timerEnd: `regeneration of ${pathname}`,
                },
            });
            return false;
        }

        await pageRegenerator.regenerate(pathname);
        await this.context.save();

        logger().info({
            op: 'done',
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `regeneration of ${pathname}`,
            },
        });

        return true;
    }

    private getMatchingPageRegenerator(
        pathname: string,
    ): PageRegenerator<any, any> | undefined {
        for (const pageRegenerator of this.regenerators) {
            if (pageRegenerator.match(pathname)) {
                return pageRegenerator;
            }
        }
    
        return undefined;
    }
    
}

