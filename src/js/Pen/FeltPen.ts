import Pen, { AttributeData } from "./Pen";
import { Line } from "../Lines/LineGenerator";
import { getPointRadius, generateCircleVertices } from "./PenUtils";

const MAX_ANGLE = 0.5;

const FeltPen: Pen = {
  generateAttributeData(lineData: Line): AttributeData {
    const line = lineData.points;
    if (line.length === 0) {
      return { vertices: [] };
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

      const pointRadius = getPointRadius(point) * lineData.thickness;
      const oldPointRadius = getPointRadius(oldPoint) * lineData.thickness;

      let aX = oldPoint.x + perpX * oldPointRadius;
      let aY = oldPoint.y + perpY * oldPointRadius;

      let bX = oldPoint.x - perpX * oldPointRadius;
      let bY = oldPoint.y - perpY * oldPointRadius;

      let cX = point.x + perpX * pointRadius;
      let cY = point.y + perpY * pointRadius;

      let dX = point.x - perpX * pointRadius;
      let dY = point.y - perpY * pointRadius;

      meshPoints.push(
        aX,
        aY,
        ...lineData.color,
        bX,
        bY,
        ...lineData.color,
        cX,
        cY,
        ...lineData.color,
        dX,
        dY,
        ...lineData.color
      );

      // Add a rounded line cap
      const minAngle = Math.min(angle, nextAngle);
      const maxAngle = Math.max(angle, nextAngle);
      const sign = Math.sign(angle - nextAngle);
      for (let theta = minAngle; theta < maxAngle; theta += MAX_ANGLE) {
        const perpTheta = theta + Math.PI / 2;
        const x = point.x + sign * Math.cos(perpTheta) * pointRadius;
        const y = point.y + sign * Math.sin(perpTheta) * pointRadius;
        meshPoints.push(
          x, y, 
          ...lineData.color, 
          dX, dY, 
          ...lineData.color
        );
      }
      // Add final point to fix the seam
      meshPoints.push(
        cX, cY, 
        ...lineData.color, 
        dX, dY, 
        ...lineData.color
      );

      oldPoint = point;
    }

    const firstBall = generateCircleVertices(
      line[0],
      lineData.color,
      lineData.thickness
    );
    const lastBall = generateCircleVertices(
      line[line.length - 1],
      lineData.color,
      lineData.thickness
    );
    const n = lastBall.length;

    // We add these vertices so that flat triangles
    // are drawn between disjoint objects
    meshPoints.splice(
      0,
      0,
      firstBall[0],
      firstBall[1],
      ...lineData.color,
      ...firstBall
    );
    meshPoints.push(
      // ...lastBall,
      ...lastBall,
      lastBall[meshPoints.length - 6],
      lastBall[meshPoints.length - 5],
      ...lineData.color,
      lastBall[meshPoints.length - 6],
      lastBall[meshPoints.length - 5],
      ...lineData.color
    );

    return { vertices: meshPoints };
  }
};
export default FeltPen;
