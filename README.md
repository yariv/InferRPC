# InferRPC Introduction

InferRPC is a TypeScript library that facilitates writing API clients and servers that communicate by a protocol described by a shared schema. InferRPC provides the following benefits:

1. Compile-time type checking of both client and server code.
2. Run-time validation of requests and responses to ensure they comply with the schema's basic types as well as extended validation rule (e.g. does this string represent a URL?)
3. Zero code generation enabling lightweight clients.
4. Easy integration into any backend framework. Currently, Koa and NextJS are supported.
5. Can be extended to support arbitrary serialization protocols (although only JSON is supported right now).

InferRPC uses [Zod](https://github.com/colinhacks/zod) for expressing request/response schemas and for validating payloads.

# Usage

To implement an API client and/or server using InferRPC, you typically start by implementing a static data structure describing the schema. InferRPC uses type inference to infer the request/response types from this data structured.

InferRPC schemas are TypeScript dictionaries mapping method names to request and response schema.

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

## Server Example

A complete Koa-based server for this schema can be implemented with the following code snippet:

```typescript
import Koa from "koa";
import Router from "koa-router";
import { Server } from "net";
import { createKoaRoute } from "InferRPC/koaAdapter";
import { ApiHttpError } from "InferRPC/types";
import { testSchema } from "./testSchema";

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

NextJS is also supported. This snipped shows to implement a NextJS API handler:

```typescript
import { createNextHandler } from "InferRPC/nextAdapter"

export default createNextHandler(
      testSchema,
      "divide",
      async ({ num1, num2 }) => {
        if (num2 === 0) {
          throw new ApiHttpError("Can't divide by 0", 400);
        }
        return num1 / num2;
      }
    );
  });
```

Below are a few screenshots from VSCode highlighting the benefits of how InferRPC leverages TypeScript's type checking.

- Your editor's auto-complete feature can help you choose a valid method name:

<img width="746" alt="Screen Shot 2021-03-10 at 9 33 39 AM" src="https://user-images.githubusercontent.com/12111/110671761-c02ff780-8183-11eb-8f60-b1e40098d3b2.png">

- If you try to implement an invalid method name, you get an error:
<img width="694" alt="Screen Shot 2021-03-09 at 4 57 41 PM" src="https://user-images.githubusercontent.com/12111/110559165-95e52800-80f8-11eb-94a5-a0d39318d8a5.png">

- If you try to add an invalid parameter name, you get an error:
<img width="852" alt="Screen Shot 2021-03-09 at 4 58 22 PM" src="https://user-images.githubusercontent.com/12111/110559214-b01f0600-80f8-11eb-9aba-db4f5191154b.png">

- If your method returns an invalid response type, you get an error:

<img width="826" alt="Screen Shot 2021-03-09 at 4 59 39 PM" src="https://user-images.githubusercontent.com/12111/110559332-dc3a8700-80f8-11eb-9e45-7062043ed920.png">

## Client Example

Implementing a client that adheres to the schema is easy. Here's an example:

```typescript
const testClient = async () => {
  const client = new TypedHttpClient("http://localhost:3001/api", testSchema);
  const result = await client.call("divide", { num1: 10, num2: 2 });
  console.log(result);
};
```

The following screenshots show the benefits of InferRPC's static type checking.

- Your editor can help you auto-complete the valid method names:
<img width="710" alt="Screen Shot 2021-03-09 at 3 43 25 PM" src="https://user-images.githubusercontent.com/12111/110553720-4568cd00-80ee-11eb-9556-3f3ec78d9cdf.png">

- Auto-complete also works for parameters:
<img width="801" alt="Screen Shot 2021-03-09 at 3 44 28 PM" src="https://user-images.githubusercontent.com/12111/110553795-67624f80-80ee-11eb-8663-03fb14ac5bd4.png">

- If you enter a wrong method name, you get an error:
<img width="842" alt="Screen Shot 2021-03-09 at 5 02 01 PM" src="https://user-images.githubusercontent.com/12111/110559962-017bc500-80fa-11eb-9b88-9c07561e5803.png">

- If you enter a wrong parameter name, you get an error:

<img width="831" alt="Screen Shot 2021-03-09 at 5 02 30 PM" src="https://user-images.githubusercontent.com/12111/110559994-0e98b400-80fa-11eb-80f3-10796f9272e5.png">

- If you enter a wrong parameter type, you get an error:
<img width="844" alt="Screen Shot 2021-03-09 at 5 03 05 PM" src="https://user-images.githubusercontent.com/12111/110560010-15bfc200-80fa-11eb-9cc4-bc5c9d41f99f.png">

- The response type is checked as well:
<img width="783" alt="Screen Shot 2021-03-09 at 5 09 00 PM" src="https://user-images.githubusercontent.com/12111/110560058-2cfeaf80-80fa-11eb-89e2-5e40919e8104.png">


# Websockets

InferRPC also supports statically typed bi-directional communication with WebSockets.

