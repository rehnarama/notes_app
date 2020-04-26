import { Point } from "../Lines/LineGenerator";
import { Color } from "../Lines/LineRenderer";

const CIRCLE_VERTICE_PER_PIXEL = 2;
const DEFAULT_LINE_WIDTH = 1;

export function getPointRadius(point: Point) {
  const pressure = point.pressure;
  const pointSquare = pressure * pressure;
  return DEFAULT_LINE_WIDTH + 5 * pointSquare;
}

export function buildTriangle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  color: Color
) {
  return [a.x, a.y, ...color, b.x, b.y, ...color, c.x, c.y, ...color];
}

export function buildQuad(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
  color: Color
) {
  return [...buildTriangle(a, c, b, color), ...buildTriangle(b, c, d, color)];
}

export function generateCircleVertices(
  point: Point,
  color: Color,
  thickness: number = 1
) {
  const vertices = [];

  const radius = getPointRadius(point) * thickness;
  const circumference = radius * Math.PI;
  const nVertices = CIRCLE_VERTICE_PER_PIXEL * circumference;
  const dTheta = (2 * Math.PI) / nVertices;

  for (let theta = 0; theta <= 2 * Math.PI; theta += dTheta) {
    const x1 = radius * Math.cos(theta) + point.x;
    const y1 = radius * Math.sin(theta) + point.y;

    const nextTheta = Math.min(2 * Math.PI, theta + dTheta);

    const x2 = radius * Math.cos(nextTheta) + point.x;
    const y2 = radius * Math.sin(nextTheta) + point.y;
    vertices.push(
      ...buildTriangle(point, { x: x1, y: y1 }, { x: x2, y: y2 }, color)
    );
  }

  return vertices;
}
