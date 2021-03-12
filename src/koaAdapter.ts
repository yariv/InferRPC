import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { getUntypedServerFunc } from "./baseApi";
import {
  AbstractApiSchemaType,
  InferInterface,
  TypedServerFunc,
} from "./types";
import { Request } from "koa";
import { createHttpHandler } from "./httpServer";

// Create a route with the given Koa router. The route implements
// a method from the given schema.
export const createKoaRoute = <
  ApiSchemaType extends AbstractApiSchemaType,
  MethodType extends keyof ApiSchemaType
>(
  router: Router,
  schema: ApiSchemaType,
  methodName: MethodType,
  handler: TypedServerFunc<ApiSchemaType, MethodType, Request>
) => {
  const httpHandler = createHttpHandler(
    getUntypedServerFunc(schema, methodName, handler)
  );
  router.post(methodName as string, bodyParser(), async (ctx) => {
    const resp = await httpHandler(ctx.request.body, ctx.request);
    ctx.status = resp.status;
    ctx.body = resp.status === 200 ? JSON.stringify(resp.body) : resp.body;
  });
};

// Add all of the methods from the object that implements the
// inferred interface to the Koa router.
export const createKoaRoutes = <SchemaType extends AbstractApiSchemaType>(
  router: Router,
  schema: SchemaType,
  impl: InferInterface<SchemaType>
) => {
  for (const methodName of Object.keys(impl)) {
    createKoaRoute(router, schema, methodName, impl[methodName]);
  }
};
