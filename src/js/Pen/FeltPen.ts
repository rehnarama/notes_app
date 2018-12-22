import Pen from "./Pen";
import { Point } from "../LineGenerator";

const MAX_ANGLE = 0.1;

export default class FeltPen extends Pen {
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

      const angle = Math.atan2(dy, dx);
      const meanAngle = Math.atan2((dy + ndy) / 2, (dx + ndx) / 2);

      // A cheaty method to get round edges if angle change too quickly
      if (Math.abs(meanAngle - angle) > MAX_ANGLE) {
        meshPoints.push(...this.generateCircleVertices(point));
      }

      // Get the perpendicular angle between the points,
      // required to know where to shift the points in the triangles ABC and BCD
      let perp = meanAngle + Math.PI / 2;

      let perpX = Math.cos(perp);
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

    const firstBall = this.generateCircleVertices(line[0]);
    const lastBall = this.generateCircleVertices(line[line.length - 1]);
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
  public getColor(): string {
    return "000000";
  }
}
