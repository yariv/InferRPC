import * as z from "zod";
import { Peer, PeerListener } from "../src/bidirectional";

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

describe("bidirectional test", () => {
  it("works", async () => {
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

    peer1.setHandler("divide", async ({ num1, num2 }) => {
      peer2.onMessage(peer1.serialize("divideResult", num1 / num2));
    });
    peer1.setHandler("sayHi", async ({ name }) => {
      peer2.onMessage(peer1.serialize("sayHiResult", "Hi " + name));
    });

    await new Promise((resolve) => {
      peer2.setHandler("divideResult", async (num) => {
        expect(num).toStrictEqual(2);
        resolve(null);
      });
      peer1.onMessage(peer2.serialize("divide", { num1: 10, num2: 5 }));

      resolve(null);
    });
    await new Promise((resolve) => {
      peer2.setHandler("sayHiResult", async (result) => {
        expect(result).toStrictEqual("Hi Sarah");
        resolve(null);
      });
      peer1.onMessage(peer2.serialize("sayHi", { name: "Sarah" }));
    });
  });
});
