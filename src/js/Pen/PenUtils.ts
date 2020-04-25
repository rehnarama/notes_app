import { Point } from "../Lines/LineGenerator";

const CIRCLE_VERTICE_PER_PIXEL = 5;
const DEFAULT_LINE_WIDTH = 1;

export function getPointRadius(point: Point) {
  const pressure = point.pressure;
  const pointSquare = pressure * pressure;
  return DEFAULT_LINE_WIDTH + 5 * pointSquare;
}

export function generateCircleVertices(
  point: Point,
  color: number[],
  thickness: number = 1
) {
  const vertices = [];

  const radius = getPointRadius(point) * thickness;
  const circumference = radius * Math.PI;
  const nVertices = CIRCLE_VERTICE_PER_PIXEL * circumference;
  const dTheta = (2 * Math.PI) / nVertices;

  for (let theta = 0; theta < 2 * Math.PI; theta += 2 * dTheta) {
    const x1 = radius * Math.cos(theta) + point.x;
    const y1 = radius * Math.sin(theta) + point.y;

    const x2 = radius * Math.cos(theta + dTheta) + point.x;
    const y2 = radius * Math.sin(theta + dTheta) + point.y;
    vertices.push(
      x1,
      y1,
      ...color,
      point.x,
      point.y,
      ...color,
      x2,
      y2,
      ...color
    );
  }

  // Connect to the first vertice to "close" the circle
  vertices.push(vertices[0], vertices[1], ...color);

  return vertices;
}
