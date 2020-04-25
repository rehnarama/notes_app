import interpolateLine from "./LineInterpolation";
import Pen, { AttributeData } from "../Pen/Pen";
import { LineId } from "./Lines";
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
export { Point, Line };

export default class LineGenerator {
  private pen: Pen;

  // private oldLineLength: Map<LineId, number> = new Map();
  private lineVertices: Map<LineId, AttributeData> = new Map();
  private vertices: number[] = [];

  private isDirty = false;

  constructor(pen: Pen) {
    this.pen = pen;
  }

  public addLine(id: LineId, line: Line) {
    const interpolatedLine: Line = {
      points: interpolateLine(line.points),
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
    // this.oldLineLength.delete(id);
    this.isDirty = true;
  }

  public generateData(): AttributeData {
    if (this.isDirty) {
      const data = Array.from(this.lineVertices.values());
      let counter = 0;
      for (const attributes of data) {
        for (const attribute of attributes.vertices) {
          this.vertices[counter] = attribute;
          counter++;
        }
      }
      this.vertices.splice(counter, this.vertices.length - counter);
    }

    return {
      vertices: this.vertices
    };
  }
}
