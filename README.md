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
<img width="1036" alt="Screen Shot 2021-03-09 at 11 42 55 AM" src="https://user-images.githubusercontent.com/12111/110551046-a510a980-80e9-11eb-9d3c-6b24fdc3e086.png">