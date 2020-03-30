import interpolateLine from "./LineInterpolation";
import { clamp } from "./utils";
import Pen from "./Pen/Pen";
import { LineId } from "./Lines";
import { Color } from "./LineRenderer";

const DEFAULT_PRESSURE = 0.5;
const MIN_REMOVE_DISTANCE = 10;

class Point {
  x: number;
  y: number;
  pressure: number;
  constructor(x: number, y: number, pressure?: number) {
    this.x = x;
    this.y = y;
    this.pressure = pressure || DEFAULT_PRESSURE;
  }
}
interface Line {
  points: Point[];
  color: Color;
}
export { Point, Line };

export default class LineGenerator {
  private pen: Pen;

  private lineVertices: Map<
    LineId,
    { vertices: number[]; colors: number[] }
  > = new Map();
  private vertices: number[] = [];
  private colors: number[] = [];

  private isDirty = false;

  constructor(pen: Pen) {
    this.pen = pen;
  }

  public addLine(id: LineId, line: Line) {
    const interpolatedLine = {
      points: interpolateLine(line.points),
      color: line.color
    }
    const vertices = this.pen.generateVertices(interpolatedLine);
    this.isDirty = this.lineVertices.has(id); // Since we have to clear the old vertices in this case...
    this.lineVertices.set(id, vertices);

    if (!this.isDirty) {
      // If we're dirty, then this will be cleared anyway, so might as well not do it at all
      this.vertices.push(...vertices.vertices);
      this.colors.push(...vertices.colors);
    }
  }

  public removeLine(id: LineId) {
    this.lineVertices.delete(id);
    this.isDirty = true;
  }

  public generateData(): { vertices: Float32Array; color: Float32Array } {
    if (this.isDirty) {
      const lineVertices = Array.from(this.lineVertices.values());
      this.vertices = ([] as number[]).concat(
        ...lineVertices.map(a => a.vertices)
      );
      this.colors = ([] as number[]).concat(...lineVertices.map(a => a.colors));
    }

    return {
      vertices: new Float32Array(this.vertices),
      color: new Float32Array(this.colors)
    };
  }
}
