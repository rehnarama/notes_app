import Pen, { AttributeData } from "./Pen";
import { Line, Point } from "../Lines/LineGenerator";
import {
  getPointRadius,
  generateCircleVertices,
  buildQuad,
  buildTriangle
} from "./PenUtils";
import CubicBezier from "../Lines/CubicBezier";

const MAX_ANGLE = 0.5;

const DEBUG = false;

const FeltPen: Pen = {
  generateAttributeData(lineData: Line): AttributeData {
    const line = lineData.points;

    if (line.length === 0) {
      return { vertices: [] };
    }

    let oldPoint = null;

    let meshPoints: number[] = generateCircleVertices(
      line[0],
      lineData.color,
      lineData.thickness
    );

    const window: Point[] = new Array(4);
    window[0] = line[0];
    window[1] = line[0];
    window[2] = line[0];
    window[3] = line[0];
    for (let index = 0; index < line.length; index++) {
      let point = line[index];
      let nextPoint = line[index + 1];
      window[(index + 1) % window.length] =
        line[Math.min(index + 1, line.length - 1)];
      window[(index + 2) % window.length] =
        line[Math.min(index + 2, line.length - 1)];

      const p0 = window[(index + 6) % window.length];
      const p1 = window[(index + 5) % window.length];
      const p2 = window[(index + 4) % window.length];
      const p3 = window[(index + 3) % window.length];
      const bezier = new CubicBezier(p0, p1, p2, p3);
      point = bezier.evaluate(index <= 2 ? 0 : 0.33);
      nextPoint = bezier.evaluate(index === line.length - 1 ? 1 : 0.66);

      if (oldPoint === null) {
        oldPoint = point;
        continue;
      }


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

      let a = {
        x: oldPoint.x + perpX * oldPointRadius,
        y: oldPoint.y + perpY * oldPointRadius
      };

      let b = {
        x: oldPoint.x - perpX * oldPointRadius,
        y: oldPoint.y - perpY * oldPointRadius
      };

      let c = {
        x: point.x + perpX * pointRadius,
        y: point.y + perpY * pointRadius
      };
      let d = {
        x: point.x - perpX * pointRadius,
        y: point.y - perpY * pointRadius
      };
      // While we techincally could get away with only one quad, it will cause precision problems
      // when adding the line cap
      buildQuad(meshPoints, oldPoint, a, point, c, lineData.color);
      buildQuad(meshPoints, oldPoint, b, point, d, lineData.color);

      // Add a rounded line cap
      const minAngle = Math.min(angle, nextAngle);
      const maxAngle = Math.max(angle, nextAngle);
      const sign = Math.sign(angle - nextAngle);
      let oldCapPoint: { x: number; y: number } | null = null;
      let theta = minAngle;
      while (theta <= maxAngle) {
        const perpTheta = theta + Math.PI / 2;
        const x = point.x + sign * Math.cos(perpTheta) * pointRadius;
        const y = point.y + sign * Math.sin(perpTheta) * pointRadius;
        const capPoint = { x, y };
        if (oldCapPoint !== null) {
          buildTriangle(
            meshPoints,
            point,
            oldCapPoint,
            capPoint,
            lineData.color
          );
        }
        oldCapPoint = capPoint;

        if (theta === maxAngle) {
          break;
        } else {
          theta = Math.min(theta + MAX_ANGLE, maxAngle);
        }
      }

      oldPoint = point;
    }

    meshPoints.push(
      ...generateCircleVertices(
        line[line.length - 1],
        lineData.color,
        lineData.thickness
      )
    );

    if (DEBUG) {
      // Draws red dots representing each point
      for (let point of line) {
        meshPoints.push(
          ...generateCircleVertices(
            point,
            [1, 0, 0, 1],
            lineData.thickness * 0.5
          )
        );
      }
      const window = new Array(4);
      for (let i = 0; i < line.length - 1; i++) {
        window[i % 4] = line[i];
        if (i < 4) {
          continue;
        }
        const p0 = window[(i + 1) % 4];
        const p1 = window[(i - 0) % 4];
        const p2 = window[(i - 1) % 4];
        const p3 = window[(i - 2) % 4];
        const bezier = new CubicBezier(p0, p1, p2, p3)
        const point = bezier.evaluate(0.75);
        meshPoints.push(
          ...generateCircleVertices(
            point,
            [1, 0, 0, 1],
            lineData.thickness * 0.5
          )
        );
      }
    }

    return { vertices: meshPoints };
  }
};
export default FeltPen;
