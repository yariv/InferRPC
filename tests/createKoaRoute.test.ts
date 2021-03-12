import Koa from "koa";
import Router from "koa-router";
import { Server } from "net";
import portfinder from "portfinder";
import { TypedHttpClient } from "../src/httpClient";
import { createKoaRoute, createKoaRoutes } from "../src/koaAdapter";
import { ApiHttpError, InferInterface } from "../src/types";
import { testSchema } from "./testSchema";

const pathPrefix = "/api/";
const createServer = (
  port: number,
  addRoutes: (router: Router) => void
): Server => {
  const koa = new Koa();
  const apiRouter = new Router({
    prefix: pathPrefix,
  });

  addRoutes(apiRouter);
  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());
  return koa.listen(port);
};

const addSeparateRoutes = (apiRouter: Router) => {
  createKoaRoute(apiRouter, testSchema, "divide", async ({ num1, num2 }) => {
    if (num2 === 0) {
      throw new ApiHttpError("Can't divide by 0", 400);
    }
    return num1 / num2;
  });

  createKoaRoute(apiRouter, testSchema, "sayHi", async ({ name }) => {
    return "Hi " + name;
  });
};

const server: InferInterface<typeof testSchema> = {
  sayHi({ name }) {
    return "Hi " + name;
  },

  divide({ num1, num2 }) {
    if (num2 === 0) {
      throw new ApiHttpError("Can't divide by 0", 400);
    }
    return num1 / num2;
  },
};

const addRoutesInterface = (apiRouter: Router) => {
  createKoaRoutes(apiRouter, testSchema, server);
};

for (const addRoutesFunc of [addSeparateRoutes, addRoutesInterface]) {
  describe("typedApi createKoaRoute", () => {
    let client: TypedHttpClient<typeof testSchema>;
    let server: Server;

    beforeAll(async () => {
      const port = await portfinder.getPortPromise();

      client = new TypedHttpClient(
        "http://localhost:" + port + pathPrefix,
        testSchema
      );
      server = await createServer(port, addRoutesFunc);
    });

    afterAll(async () => {
      await server.close();
    });

    test("sayHi", async () => {
      const res = await client.call("sayHi", { name: "Eve" });
      expect(res).toStrictEqual("Hi Eve");
    });

    test("divide works", async () => {
      const res = await client.call("divide", { num1: 15, num2: 5 });
      expect(res).toStrictEqual(3);
    });

    test("divide error", async () => {
      try {
        await client.call("divide", { num1: 15, num2: 0 });
        fail();
      } catch (e) {
        expect(e.message).toStrictEqual("Can't divide by 0");
      }
    });

    test("schema error", async () => {
      try {
        await client.call("divide", {} as any);
        fail();
      } catch (e) {
        expect(e.message).toStrictEqual(
          JSON.stringify([
            {
              code: "invalid_type",
              expected: "number",
              received: "undefined",
              path: ["num1"],
              message: "Required",
            },
            {
              code: "invalid_type",
              expected: "number",
              received: "undefined",
              path: ["num2"],
              message: "Required",
            },
          ])
        );
      }
    });

    test("schema error", async () => {
      try {
        await client.call("divide", {} as any);
        fail();
      } catch (e) {
        expect(e.message).toStrictEqual(
          JSON.stringify([
            {
              code: "invalid_type",
              expected: "number",
              received: "undefined",
              path: ["num1"],
              message: "Required",
            },
            {
              code: "invalid_type",
              expected: "number",
              received: "undefined",
              path: ["num2"],
              message: "Required",
            },
          ])
        );
      }
    });
  });
}
