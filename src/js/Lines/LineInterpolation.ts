import { Line, Point } from "./LineGenerator";

const POINT_PER_PIXEL = 0.5;

function calculateQuadraticPoints(points: Point[]) {
  const start = new Point(
    (points[0].x + points[1].x) / 2,
    (points[0].y + points[1].y) / 2,
    (points[0].pressure + points[1].pressure) / 2
  );
  const end = new Point(
    (points[1].x + points[2].x) / 2,
    (points[1].y + points[2].y) / 2,
    (points[1].pressure + points[2].pressure) / 2
  );
  const control = points[1];
  return { start, end, control };
}

function interpolatePoints(t: number, p1: Point, p2: Point, p3: Point) {
  const it = 1 - t;
  const x = it * it * p1.x + 2 * t * it * p2.x + t * t * p3.x;
  const y = it * it * p1.y + 2 * t * it * p2.y + t * t * p3.y;
  const pressure =
    it * it * p1.pressure + 2 * t * it * p2.pressure + t * t * p3.pressure;

  return new Point(x, y, pressure);
}

export default function interpolateLine(line: Point[]): Point[] {
  const newLine: Point[] = [];

  // Since every point requries three points,
  // we have to pad to display first and last point
  const n = line.length;
  const paddedLine = [line[0], ...line, line[n - 1]];

  const points = new Array(3);

  for (const point of paddedLine) {
    points[0] = points[1];
    points[1] = points[2];
    points[2] = point;

    if (!points[0]) {
      continue;
    }

    const { start, control, end } = calculateQuadraticPoints(points);

    const dx = start.x - control.x + (control.x - end.x);
    const dy = start.y - control.y + (control.y - end.y);

    const nPoints = Math.sqrt(dx * dx + dy * dy) * POINT_PER_PIXEL;

    for (let t = 0; t <= 1; t += 1 / nPoints) {
      let point = interpolatePoints(t, start, control, end);
      newLine.push(point);
    }
  }
  return newLine;
}
