import * as z from "zod";
import { Peer, PeerListener } from "../src/peer";

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

describe("p2p test", () => {
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

  it("JSON parse error", async () => {
    return new Promise((resolve) => {
      const listener: PeerListener = {
        onMissingHandler: (msgType) => {},
        onParseError: (error) => {
          expect(error.message).toStrictEqual(
            "Unexpected token i in JSON at position 0"
          );
          expect(error.name).toStrictEqual("SyntaxError");
          resolve(null);
        },
      };
      const peer1 = new Peer(schema1, schema2, listener);
      peer1.onMessage("invalid");
    });
  });

  it("validation error", async () => {
    return new Promise((resolve) => {
      const listener: PeerListener = {
        onMissingHandler: (msgType) => {},
        onParseError: (error) => {
          expect(
            error.message.startsWith("2 validation issue(s)")
          ).toBeTruthy();
          resolve(null);
        },
      };
      const peer1 = new Peer(schema1, schema2, listener);
      peer1.onMessage(JSON.stringify({ type: "divide", params: {} }));
    });
  });

  it("Missing handler error", async () => {
    return new Promise((resolve) => {
      const listener: PeerListener = {
        onMissingHandler: (msgType) => {
          resolve(null);
        },
        onParseError: (error) => {},
      };
      const peer1 = new Peer(schema1, schema2, listener);
      peer1.onMessage(
        JSON.stringify({ type: "divide", params: { num1: 10, num2: 5 } })
      );
    });
  });
});
