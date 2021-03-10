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

- If the client sends an invalid request to the server, the server will return a Zod validation error, as shown in this snippet (note that Zod lets you customize error messages if you want them to be more user friendly):
<img width="510" alt="Screen Shot 2021-03-09 at 5 26 58 PM" src="https://user-images.githubusercontent.com/12111/110713244-714f8580-81b6-11eb-9ffb-3f5ce0cc77f5.png">


# Peer-to-Peer Protocols

InferRPC also supports statically typed peer-to-peer protocols for usage with bi-directional streams such as WebSockets.

Peer-to-Peer protocols differ from client-server protocol in that they don't have a pre-defined request-response flow. Instead, each peer may send and receive messages at any time. This leads to a different schema definition:

```typescript
type PeerSchema = Record<string, z.ZodType<any>>
```

This schema is a mapping between method names and payloads, which can be any Zod type.

Here's an example, inspired by the client/server example above:

```typescript
const schema1 = {
  divide: z.object({
    num1: z.number(),
    num2: z.number(),
  }),
  sayHi: z.object({
    name: z.string(),
  }),
};

const schema2 = {
  divideResult: z.number(),
  sayHiResult: z.string(),
};
```

To use InferRFC in a p2p application, create a Peer object. Its constructor takes 2 schemas: the schema for the incoming messages, the schema for the outgoing messages, and a listener for errors. Here's an example:

```typescript
const listener: PeerListener = {
  onMissingHandler: (msgType) => {
    console.error("missing handler", msgType);
  },
  onParseError: (error) => {
    console.error("parse error", error);
  },
};

const peer1 = new Peer(schema1, schema2, listener);
const peer2 = new Peer(schema2, schema1, listener);
```

In this example, the two Peers are initialized. The Peers use opposite schemas for incoming and outgoing messages, but it's also possible for Peers to use the same schema if their protocol is symmetric.

The following snippet shows how to simulate bi-directional communication between peers:

```typescript
peer1.setHandler("divide", async ({ num1, num2 }) => {
  peer2.onMessage(peer1.serialize("divideResult", num1 / num2));
});
peer1.setHandler("sayHi", async ({ name }) => {
  peer2.onMessage(peer1.serialize("sayHiResult", "Hi " + name));
});
peer2.setHandler("divideResult", async (num) => {
  console.log(num); // prints '2'
});
peer2.setHandler("sayHiResult", async (result) => {
  console.log(result); // prints "Hi Sarah";
});

peer1.onMessage(peer2.serialize("divide", { num1: 10, num2: 5 }));
peer1.onMessage(peer2.serialize("sayHi", { name: "Sarah" }));
```

Just as with the client/server examples above, InferRPC ensures types as statically checked and your IDE can auto-complete valid values for you.

- Handler names are auto-completed:
<img width="580" alt="Screen Shot 2021-03-10 at 3 28 30 PM" src="https://user-images.githubusercontent.com/12111/110711983-49abed80-81b5-11eb-8bd7-837d8a3d1434.png">

- So are handler parameters:
<img width="596" alt="Screen Shot 2021-03-10 at 3 25 23 PM" src="https://user-images.githubusercontent.com/12111/110712082-76600500-81b5-11eb-9fa2-c38540df4a9d.png">

- Invalid handler parameters cause compilation errors:
<img width="613" alt="Screen Shot 2021-03-10 at 3 25 43 PM" src="https://user-images.githubusercontent.com/12111/110712114-88da3e80-81b5-11eb-9ce3-57563521e736.png">

The same features work for serializing messages before they are sent over the wire.

- Message names are auto-completed:
<img width="589" alt="Screen Shot 2021-03-10 at 3 26 19 PM" src="https://user-images.githubusercontent.com/12111/110712164-a0b1c280-81b5-11eb-8b71-1e277dadcb6d.png">

- So are parameter names:
<img width="586" alt="Screen Shot 2021-03-10 at 3 26 38 PM" src="https://user-images.githubusercontent.com/12111/110712183-a9a29400-81b5-11eb-8979-300ff6f0bfc0.png">

- Invalid parameter types cause compilation errors:
<img width="603" alt="Screen Shot 2021-03-10 at 3 26 53 PM" src="https://user-images.githubusercontent.com/12111/110712289-cfc83400-81b5-11eb-8a0e-968fca5c33cc.png">


