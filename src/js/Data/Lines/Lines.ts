import { INetwork, Hook, FullMeshNetwork, BasicBroadcast } from "network";

import { Point, Line } from "../../Lines/LineGenerator";
import { Color } from "../../Lines/LineRenderer";
import { invLerp } from "../../math";

export type LineId = number;

interface BeginMessage {
  name: "begin";
  id: LineId;
  color: Color;
  thickness: number;
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
interface UpdateMessage {
  name: "upd";
  id: LineId;
  color: Color;
  thickness: number;
}
interface MoveMessage {
  name: "mv";
  id: LineId;
  delta: { x: number; y: number };
}
type Message =
  | BeginMessage
  | AddMessage
  | RmvMessage
  | UpdateMessage
  | MoveMessage;

type SyncRequest = ["sync_request"];
type SyncResponse = ["sync_response", Array<[LineId, Line]>];
type SyncMessage = SyncRequest | SyncResponse;

interface LineEvent {
  name: "add" | "rmv" | "upd" | "mv";
  id: LineId;
}

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export default class Lines {
  public onChange = new Hook<(msg: LineEvent) => void>();
  private currentId: LineId = 0;
  private bb: BasicBroadcast;
  private fmn: INetwork;

  private lines: Map<LineId, Line> = new Map();
  public boundingBoxes: Map<LineId, Box> = new Map();

  public constructor(fmn: INetwork) {
    this.fmn = fmn;
    this.bb = new BasicBroadcast(fmn, "Lines");

    this.bb.bDeliver.add(this.handleOnDeliver);

    for (const connection of this.fmn.connections) {
      connection.send(JSON.stringify(["sync_request"] as SyncRequest));
    }
    this.fmn.onConnection.add(c => {
      c.send(JSON.stringify(["sync_request"] as SyncRequest));

      const onMessage = (data: string) => {
        const message = JSON.parse(data) as SyncMessage;
        if (Array.isArray(message)) {
          if (message[0] === "sync_request") {
            c.send(
              JSON.stringify([
                "sync_response",
                Array.from(this.lines.entries())
              ] as SyncResponse)
            );
          } else if (message[0] === "sync_response") {
            for (const [lineId, line] of message[1]) {
              this.lines.set(lineId, line);
              this.updateBoundingBox(lineId, line.points);
              this.onChange.call({
                name: "add",
                id: lineId
              });
            }
          }
        }
      };
      c.onMessage.add(onMessage);
    });
  }

  private handleOnDeliver = (message: Message) => {
    if (message.name === "begin") {
      this.lines.set(message.id, {
        points: [],
        color: message.color,
        thickness: message.thickness
      });
    } else if (message.name === "add") {
      const line = this.lines.get(message.id);
      line?.points.push(message.point);
      this.updateBoundingBox(message.id, [message.point]);
      this.onChange.call(message);
    } else if (message.name === "rmv") {
      this.lines.delete(message.id);
      this.boundingBoxes.delete(message.id);
      this.onChange.call(message);
    } else if (message.name === "upd") {
      const line = this.lines.get(message.id);
      if (line) {
        line.color = message.color;
        line.thickness = message.thickness;
        this.onChange.call(message);
      }
    } else if (message.name === "mv") {
      const line = this.lines.get(message.id);
      if (line) {
        line.points.forEach(p => {
          p.x += message.delta.x;
          p.y += message.delta.y;
        });
        this.onChange.call(message);
        this.boundingBoxes.delete(message.id);
        this.updateBoundingBox(message.id, line.points);
      }
    }
  };

  private updateBoundingBox(lineId: LineId, points: Point[]) {
    const box: Box = this.boundingBoxes.get(lineId) ?? {
      left: Infinity,
      right: -Infinity,
      top: Infinity,
      bottom: -Infinity
    };

    for (const point of points) {
      box.left = Math.min(box.left, point.x);
      box.right = Math.max(box.right, point.x);
      box.top = Math.min(box.top, point.y);
      box.bottom = Math.max(box.bottom, point.y);
    }

    this.boundingBoxes.set(lineId, box);
  }

  public getIntersection(a: Box, b: Box): Box | null {
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);

    const intersects = left < right && top < bottom;

    if (intersects) {
      return {
        top,
        bottom,
        left,
        right
      };
    } else {
      return null;
    }
  }

  private getArea(box: Box) {
    return (box.right - box.left) * (box.bottom - box.top);
  }

  public getLinesInside(box: Box) {
    const lines: Map<LineId, Line> = new Map();
    for (const [lineId, bb] of this.boundingBoxes) {
      const intersection = this.getIntersection(box, bb);
      if (intersection) {
        if (this.getArea(intersection) > this.getArea(bb) / 2) {
          lines.set(lineId, this.lines.get(lineId) as Line);
        }
      }
    }

    return lines;
  }

  public beginLine = (
    color: Color = [0, 0, 0, 1],
    thickness: number = 1
  ): LineId => {
    this.currentId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    this.bb.bBroadcast({
      name: "begin",
      id: this.currentId,
      color,
      thickness
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

  public updateLine = (
    id: LineId,
    color: Color = [0, 0, 0, 1],
    thickness: number = 1
  ) => {
    this.bb.bBroadcast({
      name: "upd",
      id,
      color,
      thickness
    } as UpdateMessage);
  };

  public getLines = (): Map<LineId, Line> => {
    return this.lines;
  };

  public moveLine = (id: LineId, delta: { x: number; y: number }) => {
    this.bb.bBroadcast({
      name: "mv",
      id,
      delta
    } as MoveMessage);
  };
}
