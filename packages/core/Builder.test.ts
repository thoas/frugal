import { CleanConfig } from './Config.ts'
import { FrugalContext } from './FrugalContext.ts';
import { Cache } from './Cache.ts';
import { Builder } from './Builder.ts';
import { PageBuilder } from './PageBuilder.ts';
import { spy, asSpy } from '../test_util/mod.ts'
import * as asserts from '../../dep/std/asserts.ts';

Deno.test('Builder: setup build logging', async () => {
    const config = fakeConfig()
    const context = fakeContext()

    const builder = new Builder(config, context, [])

    await builder.build()

    asserts.assertEquals(asSpy(config.setupBuildLogging).calls.length, 1)
})

Deno.test('Builder: save context when done', async () => {
    const config = fakeConfig()
    const context = fakeContext()

    const builder = new Builder(config, context, [])

    await builder.build()

    asserts.assertEquals(asSpy(context.save).calls.length, 1)
})


Deno.test('Builder: delegates to underlying PageBuilders', async () => {
    const config = fakeConfig()
    const context = fakeContext()

    const pageBuilders = [fakePageBuilder(), fakePageBuilder()]
    const builder = new Builder(config, context, pageBuilders)

    await builder.build()

    asserts.assertEquals(asSpy(pageBuilders[0].buildAll).calls.length, 1)
    asserts.assertEquals(asSpy(pageBuilders[0].buildAll).calls.length, 1)
})

function fakePageBuilder() {
    return {
        buildAll: spy(() => {
            return Promise.resolve()
        }),
    } as unknown as PageBuilder<any, any>
}

function fakeConfig() {
    const config = new CleanConfig({
        root: '',
        outputDir: '',
        pages: [],
        logging: {
            loggers: {
                'frugal:Builder': 'CRITICAL'
            }
        }
    }, {})

    const setupBuildLogging = config.setupBuildLogging.bind(config)
    config.setupBuildLogging = spy(setupBuildLogging)

    return config
}

function fakeContext() {
    const context = new FrugalContext(
        fakeConfig(), 
        {}, 
        { type:'root', hash:'', dependencies: [] },
        [],
        Cache.unserialize()
    )

    context.save = spy(() => Promise.resolve())

    return context
}