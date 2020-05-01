// This is all from https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/

// Given three colinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
function onSegment(
  p: { x: number; y: number },
  q: { x: number; y: number },
  r: { x: number; y: number }
) {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are colinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(
  p: { x: number; y: number },
  q: { x: number; y: number },
  r: { x: number; y: number }
) {
  // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
  // for details of below formula.
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

  if (val == 0) return 0; // colinear

  return val > 0 ? 1 : 2; // clock or counterclock wise
}

export function intersects(
  a: [{ x: number; y: number }, { x: number; y: number }],
  b: [{ x: number; y: number }, { x: number; y: number }]
): boolean {
  // Find the four orientations needed for general and
  // special cases
  const o1 = orientation(a[0], a[1], b[0]);
  const o2 = orientation(a[0], a[1], b[1]);
  const o3 = orientation(b[0], b[1], a[0]);
  const o4 = orientation(b[0], b[1], a[1]);

  // General case
  if (o1 != o2 && o3 != o4) return true;

  // Special Cases
  // p1, q1 and p2 are colinear and p2 lies on segment p1q1
  if (o1 == 0 && onSegment(a[0], b[0], a[1])) return true;

  // p1, q1 and q2 are colinear and q2 lies on segment p1q1
  if (o2 == 0 && onSegment(a[0], b[1], a[1])) return true;

  // p2, q2 and p1 are colinear and p1 lies on segment p2q2
  if (o3 == 0 && onSegment(b[0], a[0], b[1])) return true;

  // p2, q2 and q1 are colinear and q1 lies on segment p2q2
  if (o4 == 0 && onSegment(b[0], a[1], b[1])) return true;

  return false; // Doesn't fall in any of the above cases
}
