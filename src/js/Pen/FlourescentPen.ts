import Pen from "./Pen";
import { Point } from "../LineGenerator";
import { clamp } from "../utils";

export default class FlourescentPen extends Pen {
  public generateVertices(line: Point[]): number[] {
    if (line.length === 0) {
      return [];
    }

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

      let perpX = clamp(Math.cos(perp), -0.2, 0.2);
      let perpY = Math.sin(perp);

      let A = oldC
        ? oldC
        : {
            x: oldPoint.x + perpX * this.getPointRadius(oldPoint),
            y: oldPoint.y + perpY * this.getPointRadius(oldPoint)
          };

      let B = oldD
        ? oldD
        : {
            x: oldPoint.x - perpX * this.getPointRadius(oldPoint),
            y: oldPoint.y - perpY * this.getPointRadius(oldPoint)
          };

      let C = {
        x: point.x + perpX * this.getPointRadius(point),
        y: point.y + perpY * this.getPointRadius(point)
      };

      let D = {
        x: point.x - perpX * this.getPointRadius(point),
        y: point.y - perpY * this.getPointRadius(point)
      };
      oldD = D;
      oldC = C;

      meshPoints.push(A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y);

      oldPoint = point;
    }

    const n = meshPoints.length;
    // We add these vertices so that flat triangles
    // are drawn between disjoint objects
    meshPoints.splice(0, 0, meshPoints[0], meshPoints[1]);
    meshPoints.push(
      meshPoints[n - 2],
      meshPoints[n - 1],
      meshPoints[n - 2],
      meshPoints[n - 1]
    );

    return meshPoints;
  }

  public getColor(): string {
    throw new Error("Method not implemented.");
  }
}
