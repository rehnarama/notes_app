import { INetwork, IConnection, Hook, BasicBroadcast } from "network";

interface Point {
  x: number;
  y: number;
}
interface UpdateMessage {
  type: "update";
  id: string;
  point: Point;
}
type Message = UpdateMessage;

const CHANNEL = "pointers";

export default class PointersData {
  private fmn: INetwork;
  private bb: BasicBroadcast;

  public pointerMap = new Map<string, Point>();

  public onPointerMapUpdated = new Hook<() => void>();

  public constructor(fmn: INetwork) {
    this.fmn = fmn;
    this.bb = new BasicBroadcast<Message>(this.fmn, CHANNEL);

    this.init();
  }

  private init() {
    this.bb.bDeliver.add(this.onMessage);
  }

  private onMessage = (message: Message, from: IConnection) => {
    if (message.type === "update" && from.remoteId !== this.fmn.localId) {
      this.pointerMap.set(message.id, message.point);
      this.onPointerMapUpdated.call();
    }
  };

  public updatePoint = (point: Point) => {
    if (this.fmn.localId === undefined) {
      return;
    }

    const message: UpdateMessage = {
      type: "update",
      id: this.fmn.localId.toString(),
      point
    };
    this.bb.bBroadcast(message);
  };
}
