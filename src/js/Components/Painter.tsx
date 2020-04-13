import * as React from "react";
import LineGenerator, { Point } from "../Lines/LineGenerator";
import LineRenderer, { Color } from "../Lines/LineRenderer";
import FeltPen from "../Pen/FeltPen";
import Lines from "../Lines/Lines";

const MIN_REMOVE_DISTANCE = 10;
const MIN_DISTANCE = 6;
// Default pressure is treated as
// pressure not supported, as per spec: https://www.w3.org/TR/pointerevents/
const DEFAULT_PRESSURE = 0.5;

type PointerEventHandler = (event: PointerEvent) => void;

enum Action {
  Draw,
  Move,
  Erase,
  Select
}

interface Props {
  color: Color;
  thickness: number;
  lines: Lines;
  alwaysDraw?: boolean;
  erase?: boolean;
}

class Painter extends React.PureComponent<Props> {
  previousPoint?: Point;

  moveStart = { x: 0, y: 0 };

  drawPointerIsDown = false;
  erase = false;

  isDirty = false;

  lineGenerator = new LineGenerator(FeltPen);
  lineRenderer: LineRenderer | null = null;
  targetRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    props.lines.onChange.add(msg => {
      if (msg.name === "add") {
        const line = props.lines.getLines().get(msg.id);
        if (line) {
          this.lineGenerator.addLine(msg.id, line);
        }
      } else if (msg.name === "rmv") {
        this.lineGenerator.removeLine(msg.id);
      }
      this.requestRenderFrame();
    });
  }

  componentDidMount() {
    if (this.targetRef.current === null) {
      throw new Error("Could not find target element");
    }

    this.lineRenderer = new LineRenderer(this.targetRef.current);
    this.requestRenderFrame();

    this.targetRef.current.addEventListener(
      "pointermove",
      this.handleOnPointerMove,
      { passive: true }
    );
    this.targetRef.current.addEventListener(
      "pointerdown",
      this.handleOnPointerDown,
      { passive: true }
    );
    this.targetRef.current.addEventListener(
      "pointerup",
      this.handleOnPointerUp,
      { passive: true }
    );
    this.targetRef.current.addEventListener(
      "contextmenu",
      this.handleOnContextMenu
    );
    this.targetRef.current.addEventListener("wheel", this.onWheel, {
      passive: false
    });

    window.addEventListener("resize", this.handleOnResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleOnResize);

    if (this.targetRef.current !== null) {
      this.targetRef.current.removeEventListener(
        "pointermove",
        this.handleOnPointerMove
      );
      this.targetRef.current.removeEventListener(
        "pointerdown",
        this.handleOnPointerDown
      );
      this.targetRef.current.removeEventListener(
        "pointerup",
        this.handleOnPointerUp
      );
      this.targetRef.current.removeEventListener(
        "contextmenu",
        this.handleOnContextMenu
      );
      this.targetRef.current.removeEventListener("wheel", this.onWheel);
    }
  }

  handleOnContextMenu: EventListener = event => {
    event.preventDefault();
  };

  handleOnResize = () => {
    if (this.lineRenderer !== null) {
      this.lineRenderer.updateSize();
      this.requestRenderFrame();
    }
  };

  isEraseButton = ({
    button,
    buttons
  }: {
    button: number;
    buttons: number;
  }) => {
    // This is the combination of having erase button down
    // See https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#Determining_button_states
    // button -1 happens when moving with erase down, though this seems to be undocumented
    return ((button === 5 || button === -1) && buttons === 32) || buttons === 2; // 2 is right-click
  };

  private guessPointerAction = (event: PointerEvent): Action | null => {
    let action: Action | null = null;
    if (
      (this.isEraseButton(event) && this.drawPointerIsDown) ||
      (this.props.erase && this.drawPointerIsDown)
    ) {
      action = Action.Erase;
    } else if (this.drawPointerIsDown) {
      action = Action.Draw;
    } else if (event.pointerType === "touch") {
      action = Action.Move;
    }

    return action;
  };

  private isDrawPointer = (event: PointerEvent) => {
    return event.pointerType === "pen" || this.props.alwaysDraw === true;
  };

  handleOnPointerDown: PointerEventHandler = event => {
    this.drawPointerIsDown = this.isDrawPointer(event);

    const action = this.guessPointerAction(event);

    if (action === Action.Move) {
      this.moveStart.x = event.offsetX;
      this.moveStart.y = event.offsetY;
    } else if (action === Action.Draw) {
      this.props.lines.beginLine(this.props.color, this.props.thickness);
      const point = new Point(event.offsetX, event.offsetY, event.pressure);

      this.addPoint(point);
    }
  };

  handleOnPointerUp: PointerEventHandler = event => {
    this.drawPointerIsDown = false;
  };

  eraseLine: PointerEventHandler = event => {
    if (this.lineRenderer === null) {
      return;
    }

    const point = new Point(
      event.offsetX - this.lineRenderer.position.x,
      event.offsetY - this.lineRenderer.position.y
    );

    const allLines = this.props.lines.getLines();
    for (const [id, line] of allLines) {
      for (let pointIndex = 0; pointIndex < line.points.length; pointIndex++) {
        const dx = line.points[pointIndex].x - point.x;
        const dy = line.points[pointIndex].y - point.y;

        const distSq = dx * dx + dy * dy;

        // Found a line close enough
        if (distSq < MIN_REMOVE_DISTANCE * MIN_REMOVE_DISTANCE) {
          this.props.lines.removeLine(id);
        }
      }
    }
  };

  handleOnPointerMove: PointerEventHandler = event => {
    const action = this.guessPointerAction(event);

    if (action === Action.Move && this.lineRenderer) {
      const deltaX = this.moveStart.x - event.offsetX;
      const deltaY = this.moveStart.y - event.offsetY;
      this.lineRenderer.position.x -= deltaX;
      this.lineRenderer.position.y -= deltaY;
      this.moveStart.x = event.offsetX;
      this.moveStart.y = event.offsetY;
      this.requestRenderFrame();
    } else if (action === Action.Erase) {
      this.eraseLine(event);
    } else if (action === Action.Draw) {
      const coalescedEvents =
        typeof event.getCoalescedEvents !== "undefined"
          ? event.getCoalescedEvents()
          : [];
      if (coalescedEvents.length > 0) {
        for (const e of coalescedEvents) {
          this.handleOnPointerMove(e);
        }
        return;
      }

      const curX = event.offsetX;
      const curY = event.offsetY;
      const point = new Point(curX, curY, event.pressure);

      this.addPoint(point);
    }
  };

  requestRenderFrame = () => {
    if (this.isDirty) {
      return;
    }

    this.isDirty = true;
    window.requestAnimationFrame(this.renderFrame);
  };

  private addPoint(point: Point) {
    if (this.lineRenderer) {
      point.x -= this.lineRenderer.position.x;
      point.y -= this.lineRenderer.position.y;
      point.x /= this.lineRenderer.zoom;
      point.y /= this.lineRenderer.zoom;
    }

    if (this.previousPoint) {
      const dx = this.previousPoint.x - point.x;
      const dy = this.previousPoint.y - point.y;
      // We subsample for better quality and memory efficiency
      if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) {
        return;
      }
    }
    this.props.lines.addPoint(point);
    this.previousPoint = point;
  }

  renderFrame: FrameRequestCallback = () => {
    if (this.lineRenderer === null) {
      return;
    }

    this.lineRenderer.clear();

    const data = this.lineGenerator.generateData();
    this.lineRenderer.draw(data.vertices, data.color);

    this.isDirty = false;
  };

  private wheelEventToDeltaPixels = (e: WheelEvent) => {
    if (e.deltaMode === 0) {
      return { x: e.deltaX / 200, y: e.deltaY / 200 };
    } else if (e.deltaMode === 1) {
      return { x: e.deltaX / 3, y: e.deltaY / 3 };
    } else {
      return { x: e.deltaX / 800, y: e.deltaY / 800 };
    }
  };

  onWheel = (e: WheelEvent) => {
    const delta = this.wheelEventToDeltaPixels(e);
    if (this.lineRenderer) {
      if (e.ctrlKey) {
        let zoomDelta = -delta.y * 0.1;

        const x = e.offsetX / this.lineRenderer.zoom;
        const y = e.offsetY / this.lineRenderer.zoom;

        this.lineRenderer.setZoom(this.lineRenderer.zoom + zoomDelta, { x, y });
      } else if (e.shiftKey) {
        this.lineRenderer.position.x += (10 * delta.y) / this.lineRenderer.zoom;
      } else {
        this.lineRenderer.position.x += (10 * delta.x) / this.lineRenderer.zoom;
        this.lineRenderer.position.y += (10 * delta.y) / this.lineRenderer.zoom;
      }
      this.requestRenderFrame();
    }
    e.preventDefault();
  };

  render() {
    return (
      <div
        ref={this.targetRef}
        style={{
          touchAction: "none",
          overflow: "hidden"
        }}
      />
    );
  }
}
export default Painter;
