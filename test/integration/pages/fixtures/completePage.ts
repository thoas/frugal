import { DataResponse, PathList, RenderContext, StaticHandlerContext } from "../../../../page.ts";

export const route = "/:foo";

export function getPaths(): PathList<typeof route> {
    return [{ foo: "foo" }, { foo: "bar" }];
}

type Data = { foo: string };

export function generate(context: StaticHandlerContext<typeof route>) {
    if (context.path.foo === "foo") {
        return new DataResponse({
            data: { foo: "Hello foo" },
            status: 201,
            headers: {
                "x-foo": "foo",
            },
        });
    }
    if (context.path.foo === "bar") {
        return new DataResponse({
            data: { foo: "Hello bar" },
            status: 202,
            headers: {
                "x-foo": "bar",
            },
        });
    }
}

export function render({ data }: RenderContext<typeof route, Data>) {
    return `data: ${data.foo}`;
}
