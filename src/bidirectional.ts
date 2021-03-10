import * as z from "zod";
import { ZodError } from "zod";

export type WsSchema = Record<string, z.ZodType<any>>;

export type WsHandlerType<IncomingSchemaType extends WsSchema> = (
  msgType: keyof IncomingSchemaType,
  msg: z.infer<IncomingSchemaType[typeof msgType]>
) => Promise<void>;

const genericMsgSchema = z.object({
  type: z.string(),
  params: z.any(),
});

export interface BiDirectionalListener {
  onParseError(error: Error): void;
  onMissingHandler(msgType: string): void;
}
export class BiDirectional<
  IncomingSchemaType extends WsSchema,
  OutgoingSchemaType extends WsSchema
> {
  incomingSchema: IncomingSchemaType;
  outgoingSchema: OutgoingSchemaType;
  listener: BiDirectionalListener;

  handlers: Record<
    keyof IncomingSchemaType,
    (msg: IncomingSchemaType[keyof IncomingSchemaType]) => Promise<void>
  >;

  constructor(
    incomingSchema: IncomingSchemaType,

    // This parameter is only used for enforcing the right type
    // definition for OutgoingSchemaType
    outgoingSchema: OutgoingSchemaType,
    listener: BiDirectionalListener
  ) {
    this.incomingSchema = incomingSchema;
    this.outgoingSchema = outgoingSchema;
    this.listener = listener;
    this.handlers = {} as any; // TODO figure out why this casting is necessary
  }

  onMessage(msg: string) {
    let msgJson;
    try {
      msgJson = JSON.parse(msg);
    } catch (e) {
      this.listener.onParseError(e);
      return;
    }

    const parseResult = genericMsgSchema.safeParse(msgJson);
    if (!parseResult.success) {
      this.listener.onParseError(parseResult.error);
      return;
    }

    const { type, params } = parseResult.data;
    if (!(type in this.handlers)) {
      this.listener.onMissingHandler(type);
      return;
    }

    const parseResult2 = this.incomingSchema[type].safeParse(params);
    if (parseResult2.success) {
      this.handlers[type](parseResult2.data).catch((err) => {
        console.warn("Uncaught error in handler", err);
      });
    } else {
      this.listener.onParseError(parseResult2.error);
      return;
    }
  }

  setHandler<MsgType extends keyof IncomingSchemaType>(
    msgType: MsgType,
    handler: (msg: z.infer<IncomingSchemaType[MsgType]>) => Promise<void>
  ) {
    this.handlers[msgType] = handler;
  }

  serialize<MsgType extends keyof OutgoingSchemaType>(
    type: MsgType,
    params?: z.infer<OutgoingSchemaType[MsgType]>
  ) {
    return JSON.stringify({ type, params });
  }
}
