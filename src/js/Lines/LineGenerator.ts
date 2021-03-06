import interpolateLine from "./LineInterpolation";
import Pen, { AttributeData } from "../Pen/Pen";
import { LineId } from "../Data/Lines/Lines";
import { Color } from "./LineRenderer";

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

  // private oldLineLength: Map<LineId, number> = new Map();
  private lineVertices: Map<LineId, AttributeData> = new Map();
  private vertices: number[] = [];

  private interpolate: boolean;

  private isDirty = false;

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

    const attrData = this.pen.generateAttributeData(interpolatedLine);

    this.isDirty = this.lineVertices.has(id);
    this.lineVertices.set(id, attrData);

    if (!this.isDirty) {
      // Since if it's dirty, vertices is gonna be re-generated anyway
      this.vertices.push(...attrData.vertices);
    }
  }

  public removeLine(id: LineId) {
    this.lineVertices.delete(id);
    this.isDirty = true;
  }

  public generateData(): AttributeData {
    if (this.isDirty) {
      let counter = 0;
      for (const attributes of this.lineVertices.values()) {
        for (const attribute of attributes.vertices) {
          this.vertices[counter] = attribute;
          counter++;
        }
      }
      this.vertices.splice(counter, this.vertices.length - counter);

      this.isDirty = false;
    }

    return {
      vertices: this.vertices
    };
  }
}
