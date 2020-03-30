import { Line, Point } from "../LineGenerator";
import { Color } from "../LineRenderer";

const CIRCLE_VERTICE_PER_PIXEL = 0.5;
const DEFAULT_LINE_WIDTH = 1;

export default abstract class Pen {
  private scaleFactor = window.devicePixelRatio;

  public updateScaleFactor() {
    this.scaleFactor = window.devicePixelRatio;
  }

  public getScaleFactor() {
    return this.scaleFactor;
  }

  protected getPointRadius(point: Point) {
    const pressure = point.pressure;
    const pointSquare = pressure * pressure;
    return (DEFAULT_LINE_WIDTH + 5 * pointSquare) * this.scaleFactor;
  }

  protected generateCircleVertices(point: Point) {
    const vertices = [];

    const radius = this.getPointRadius(point);
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

  public abstract generateVertices(
    line: Line
  ): { vertices: number[]; colors: number[] };

  public abstract getColor(): Color;
}
