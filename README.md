# SolidRPC Introduction

SolidRPC is a TypeScript library that facilitates writing API clients and servers that communicate by a protocol described by a shared schema. SolidRPC provides the following benefits:

1. Compile-time type checking of both client and server code.
2. Run-time validation of requests and responses to ensure they comply with the schema's basic types as well as extended validation rule (e.g. does this string represent a URL?)
3. Zero code generation enabling lightweight clients.
4. Easy integration into any backend framework. Currently, Koa and NextJS are supported.
5. Can be extended to support arbitrary serialization protocols (although only JSON is supported right now).

SolidRPC uses [Zod](https://github.com/colinhacks/zod) for describing request/response schemas and for validating payloads.

# Usage

To implement an API client and/or server using SolidRPC, you typically start by implementing a static data structure describing the schema. SolidRPC uses type inference to infer the request/response types from this data structured.

SolidRPC schemas are TypeScript dictionaries mapping method names to request and response schema.

In TypeScript, a schema is a data structure that adheres to the following type signature:

```typescript
import * as z from "zod";

type AbstractSchemaType = Record<
  string,
  { req: z.ZodType<any>; res: z.ZodType<any> }
>;
```

Here's an example schema with 2 methods:

1.  `sayHi`, which takes a `name` parameter and returns a string.
2.  `divide`, which takes two numbers and returns the result of dividing num1 by num2.

```typescript
import * as z from "zod";

export const testSchema = {
  sayHi: {
    req: z.object({
      name: z.string(),
    }),
    res: z.string(),
  },
  divide: {
    req: z.object({
      num1: z.number(),
      num2: z.number(),
    }),
    res: z.number(),
  },
};
```

This example only uses basic types (strings and numbers) but Zod lets you express more complex validation rules, such as whether a string contains a date, a URL, or an email address.

A complete Koa-based server for this schema can be implemented with the following code snippet:

```typescript
import Koa from "koa";
import Router from "koa-router";
import { Server } from "net";
import { createKoaRoute } from "solidRpc/koaAdapter"
import { ApiHttpError } from "solidRpc/types"
import { testSchema } from "./testSchema"

const createServer = (port: number): Server => {
  const koa = new Koa();
  const apiRouter = new Router({
    prefix: pathPrefix,
  });

  createKoaRoute(apiRouter, testSchema, "divide", async ({ num1, num2 }) => {
    if (num2 === 0) {
      throw new ApiHttpError("Can't divide by 0", 400);
    }
    return num1 / num2;
  });

  createKoaRoute(apiRouter, testSchema, "sayHi", async ({ name }) => {
    return "Hi " + name;
  });

  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());
  return koa.listen(port);
};
```

Below are a few screenshots from VSCode highlighting the benefits how SolidRPC leverages TypeScript's type checking.

- Your editor's auto-complete feature can help you choose a valid method name:

<img width="734" alt="Screen Shot 2021-03-09 at 11 37 20 AM" src="https://user-images.githubusercontent.com/12111/110553137-64b32a80-80ed-11eb-8fa5-8ec3f1c14f4e.png">

- If you try to implement an invalid method name, you get an error:

<img width="784" alt="Screen Shot 2021-03-09 at 11 32 40 AM" src="https://user-images.githubusercontent.com/12111/110553048-36354f80-80ed-11eb-9074-7363fb8842fb.png">

- If you try to add an invalid parameter name, you get an error:
<img width="696" alt="Screen Shot 2021-03-09 at 11 33 21 AM" src="https://user-images.githubusercontent.com/12111/110553289-a47a1200-80ed-11eb-81b4-c4bbce83f83c.png">


- If your method returns an invalid response type, you get an error:

<img width="634" alt="Screen Shot 2021-03-09 at 11 34 06 AM" src="https://user-images.githubusercontent.com/12111/110553222-82808f80-80ed-11eb-9fd1-b0a7e384e001.png">


