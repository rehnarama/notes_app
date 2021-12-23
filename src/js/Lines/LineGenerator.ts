import interpolateLine from "./LineInterpolation";
import Pen, { AttributeData } from "../Pen/Pen";
import { LineId } from "../Data/Lines/Lines";
import { Color } from "./LineRenderer";
import { lerp } from "../math";

const DEFAULT_PRESSURE = 0.5;

class Point {
  x: number;
  y: number;
  pressure: number;
  constructor(x: number, y: number, pressure?: number) {
    this.x = x;
    this.y = y;
    this.pressure = pressure || DEFAULT_PRESSURE;
  }

  static lerp(a: Point, b: Point, t: number) {
    return new Point(
      lerp(a.x, b.x, t),
      lerp(a.y, b.y, t),
      lerp(a.pressure, b.pressure, t)
    );
  }
}
interface Line {
  points: Point[];
  color: Color;
  thickness: number;
}
export { Point };
export type { Line };

export default class LineGenerator {
  private pen: Pen;

  private lineVertices: Map<LineId, AttributeData> = new Map();
  private lines: Map<LineId, Line> = new Map();
  private dirtyLines: Map<LineId, boolean> = new Map();
  private vertices: number[] = [];

  private interpolate: boolean;

  constructor(pen: Pen, interpolate = false) {
    this.pen = pen;
    this.interpolate = interpolate;
  }

  public addLine(id: LineId, line: Line) {
    const interpolatedLine: Line = {
      points: this.interpolate ? interpolateLine(line.points) : line.points,
      color: line.color,
      thickness: line.thickness
    };

    this.lines.set(id, interpolatedLine);
    this.dirtyLines.set(id, true);
  }

  public removeLine(id: LineId) {
    this.lines.delete(id);
    this.dirtyLines.delete(id);
    this.lineVertices.delete(id);
  }

  public generateData(): AttributeData {
    let counter = 0;
    for (const [id, line] of this.lines) {
      if (this.dirtyLines.get(id)) {
        const data = this.pen.generateAttributeData(line);
        this.lineVertices.set(id, data);
        this.dirtyLines.set(id, false);
      }
      const data = this.lineVertices.get(id) as AttributeData;

      for (const attribute of data.vertices) {
        this.vertices[counter] = attribute;
        counter++;
      }
    }
    if (this.vertices.length > counter) {
      this.vertices.splice(counter, this.vertices.length - counter);
    }

    return {
      vertices: this.vertices
    };
  }
}
