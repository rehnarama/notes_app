import { lerp } from "../math";
import { Point } from "./LineGenerator";


export default class CubicBezier {
    p0: Point;
    p1: Point;
    p2: Point;
    p3: Point;
    constructor(p0: Point, p1: Point, p2: Point, p3: Point) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    public evaluate(t: number): Point {
        const a = Point.lerp(this.p0, this.p1, t);
        const b = Point.lerp(this.p1, this.p2, t);
        const c = Point.lerp(this.p2, this.p3, t);

        const x = Point.lerp(a, b, t);
        const y = Point.lerp(b, c, t);

        const final = Point.lerp(x, y, t);
        return final;
    }
}
