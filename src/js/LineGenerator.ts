import interpolateLine from "./LineInterpolation";

const DEFAULT_PRESSURE = 0.5;
const CIRCLE_VERTICE_PER_PIXEL = 0.5;
const DEFAULT_LINE_WIDTH = 1;
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
  private lines: Line[] = new Array();
  private static scaleFactor: number = window.devicePixelRatio;

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

  private static getPointRadius(point: Point) {
    const pressure = point.pressure;
    const pointCube = pressure * pressure * pressure;
    return (DEFAULT_LINE_WIDTH + 5 * pointCube) * LineGenerator.scaleFactor;
  }

  private static generateCircleVertices(point: Point) {
    const vertices = [];

    const radius = LineGenerator.getPointRadius(point);
    const circumference = radius * Math.PI;
    const nVertices = CIRCLE_VERTICE_PER_PIXEL * circumference;
    const dTheta = (2 * Math.PI) / nVertices;

    for (let theta = 0; theta < 2 * Math.PI; theta += 2 * dTheta) {
      const x1 = radius * Math.cos(theta) + point.x;
      const y1 = radius * Math.sin(theta) + point.y;

      const x2 = radius * Math.cos(theta + dTheta) + point.x;
      const y2 = radius * Math.sin(theta + dTheta) + point.y;
      vertices.push(x1, y1, point.x, point.y, x2, y2);
    }

    // Connect to the first vertice to "close" the circle
    vertices.push(vertices[0], vertices[1]);

    return vertices;
  }

  private static generateLineVertices(line: Line) {
    if (line.length === 0) {
      return [];
    }

    LineGenerator.updateScaleFactor();
    

    let oldPoint = null;

    let meshPoints: number[] = [];
    let oldC = null,
      oldD = null;

    for (let index = 0; index < line.length; index++) {
      const point = line[index];

      if (oldPoint === null) {
        oldPoint = point;
        continue;
      }

      const nextPoint = line[index + 1];

      // Get the deltas, required for angle calculation
      const dx = point.x - oldPoint.x;
      const dy = point.y - oldPoint.y;
      let ndx = dx;
      let ndy = dy;

      if (nextPoint) {
        ndx = nextPoint.x - point.x;
        ndy = nextPoint.y - point.y;
      }

      const meanAngle = Math.atan2((dy + ndy) / 2, (dx + ndx) / 2);

      // Get the perpendicular angle between the points,
      // required to know where to shift the points in the triangles ABC and BCD
      let perp = meanAngle + Math.PI / 2;

      let perpX = Math.cos(perp);
      let perpY = Math.sin(perp);

      let A = oldC
        ? oldC
        : {
            x: oldPoint.x + perpX * LineGenerator.getPointRadius(oldPoint),
            y: oldPoint.y + perpY * LineGenerator.getPointRadius(oldPoint)
          };

      let B = oldD
        ? oldD
        : {
            x: oldPoint.x - perpX * LineGenerator.getPointRadius(oldPoint),
            y: oldPoint.y - perpY * LineGenerator.getPointRadius(oldPoint)
          };

      let C = {
        x: point.x + perpX * LineGenerator.getPointRadius(point),
        y: point.y + perpY * LineGenerator.getPointRadius(point)
      };

      let D = {
        x: point.x - perpX * LineGenerator.getPointRadius(point),
        y: point.y - perpY * LineGenerator.getPointRadius(point)
      };
      oldD = D;
      oldC = C;

      meshPoints.push(A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y);

      oldPoint = point;
    }

    const firstBall = LineGenerator.generateCircleVertices(line[0]);
    const lastBall = LineGenerator.generateCircleVertices(
      line[line.length - 1]
    );
    const n = lastBall.length;
    // We add these vertices so that flat triangles
    // are drawn between disjoint objects
    meshPoints.splice(0, 0, firstBall[0], firstBall[1], ...firstBall);
    meshPoints.push(
      ...lastBall,
      lastBall[n - 2],
      lastBall[n - 1],
      lastBall[n - 2],
      lastBall[n - 1]
    );

    return meshPoints;
  }

  public generateVertices() {
    let vertices: number[] = [];
    for (const line of this.lines) {
      vertices = vertices.concat(LineGenerator.generateLineVertices(line));
    }
    return new Float32Array(vertices);
  }
}
