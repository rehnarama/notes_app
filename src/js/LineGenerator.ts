import interpolateLine from "./LineInterpolation";
import { clamp } from "./utils";
import Pen from "./Pen/Pen";

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

  equals(other: Point) {
    return this.x === other.x && this.y === other.y;
  }
}
type Line = Point[];
export { Point, Line };

export default class LineGenerator {
  private pen: Pen;

  private lines: Line[] = new Array();
  private static scaleFactor: number = window.devicePixelRatio;

  constructor(pen: Pen) {
    this.pen = pen;
  }

  private static updateScaleFactor() {
    // We need to cache this value since querying it too often is slow
    this.scaleFactor = window.devicePixelRatio;
  }

  public addLine(line: Line) {
    this.lines.push(interpolateLine(line));
  }

  public findLine(point: Point) {
    LineGenerator.updateScaleFactor();

    for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex++) {
      const line = this.lines[lineIndex];

      for (let pointIndex = 0; pointIndex < line.length; pointIndex++) {
        const dx = line[pointIndex].x - point.x;
        const dy = line[pointIndex].y - point.y;

        const distSq = dx * dx + dy * dy;

        // Found a line close enough
        if (
          distSq <
          MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE * LineGenerator.scaleFactor
        ) {
          return line;
        }
      }
    }

    return null;
  }

  public removeLine(line: Line) {
    this.lines = this.lines.filter(l => l !== line);
  }


  public generateVertices() {
    // In case scale factor has changed, e.g. moved to another screen
    this.pen.updateScaleFactor();

    let vertices: number[] = [];
    for (const line of this.lines) {
      vertices = vertices.concat(this.pen.generateVertices(line));
    }
    return new Float32Array(vertices);
  }
}
