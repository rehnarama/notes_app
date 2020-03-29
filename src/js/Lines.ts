import { INetwork, Hook, FullMeshNetwork, BasicBroadcast } from "network";

import { Point, Line } from "./LineGenerator";

export type LineId = number;

interface BeginMessage {
  name: "begin";
  id: LineId;
}
interface AddMessage {
  name: "add";
  id: LineId;
  point: Point;
}
interface RmvMessage {
  name: "rmv";
  id: LineId;
}
type Message = BeginMessage | AddMessage | RmvMessage;

export default class Lines {
  public onChange = new Hook();
  private currentId: LineId = 0;
  private bb: BasicBroadcast;
  private fmn: INetwork;

  private lines: Map<LineId, Line> = new Map();

  public constructor(fmn: INetwork) {
    this.fmn = fmn;
    this.bb = new BasicBroadcast(fmn, "Lines");

    this.bb.bDeliver.add(this.handleOnDeliver);
  }

  private handleOnDeliver = (message: Message) => {
    if (message.name === "begin") {
      this.lines.set(message.id, []);
    } else if (message.name === "add") {
      const line = this.lines.get(message.id);
      line?.push(message.point);
    } else if (message.name === "rmv") {
      this.lines.delete(message.id);
    }
    this.onChange.call();
  }

  public beginLine = (): LineId => {
    this.currentId = Math.round(Math.random() * 1000000);
    this.bb.bBroadcast({
      name: "begin",
      id: this.currentId
    } as BeginMessage);
    return this.currentId;
  };

  public addPoint = (point: Point) => {
    this.bb.bBroadcast({
      name: "add",
      id: this.currentId,
      point
    } as AddMessage);
  };

  public removeLine = (id: LineId) => {
    this.bb.bBroadcast({
      name: "rmv",
      id: id
    } as RmvMessage);
  };

  public getLines = (): Map<LineId, Line> => {
    return this.lines;
  };
}
