import Pen from "./Pen";
import { Line } from "../LineGenerator";

const MAX_ANGLE = 0.5;

export default class FeltPen extends Pen {
  public generateVertices(
    lineData: Line
  ): { vertices: number[]; colors: number[] } {
    const line = lineData.points;
    if (line.length === 0) {
      return { vertices: [], colors: [] };
    }

    let oldPoint = null;

    let meshPoints: number[] = [];

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
      const nextAngle = Math.atan2(ndy, ndx);

      // Get the perpendicular angle between the points,
      // required to know where to shift the points in the triangles ABC and BCD
      let perp = angle + Math.PI / 2;

      let perpX = Math.cos(perp);
      let perpY = Math.sin(perp);

      const pointRadius = this.getPointRadius(point) * lineData.thickness;
      const oldPointRadius = this.getPointRadius(oldPoint) * lineData.thickness;

      let A = {
        x: oldPoint.x + perpX * oldPointRadius,
        y: oldPoint.y + perpY * oldPointRadius
      };

      let B = {
        x: oldPoint.x - perpX * oldPointRadius,
        y: oldPoint.y - perpY * oldPointRadius
      };

      let C = {
        x: point.x + perpX * pointRadius,
        y: point.y + perpY * pointRadius
      };

      let D = {
        x: point.x - perpX * pointRadius,
        y: point.y - perpY * pointRadius
      };

      meshPoints.push(A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y);

      // Add a rounded line cap
      const minAngle = Math.min(angle, nextAngle);
      const maxAngle = Math.max(angle, nextAngle);
      const sign = Math.sign(angle - nextAngle);
      for (let theta = minAngle; theta < maxAngle; theta += MAX_ANGLE) {
        const perpTheta = theta + Math.PI / 2;
        const x = point.x + sign * Math.cos(perpTheta) * pointRadius;
        const y = point.y + sign * Math.sin(perpTheta) * pointRadius;
        meshPoints.push(x, y, D.x, D.y);
      }
      // Add final point to fix the seam
      meshPoints.push(C.x, C.y, D.x, D.y);

      oldPoint = point;
    }

    const firstBall = this.generateCircleVertices(line[0], lineData.thickness);
    const lastBall = this.generateCircleVertices(
      line[line.length - 1],
      lineData.thickness
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

    const colors = new Array((meshPoints.length / 2) * 4);
    for (let i = 0; i < colors.length; i++) {
      colors[i] = lineData.color[i % 4];
    }

    return { vertices: meshPoints, colors };
  }
}
