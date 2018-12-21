import * as React from "react";
import Painter, { Line, Point } from "./Painter";

const LINES_KEY = "lines";

class App extends React.Component {
  lastKey: string = "";
  savedLines: Line[] = (JSON.parse(
    localStorage.getItem(LINES_KEY) || "[]"
  ) as Line[]).map(line => line.map(p => new Point(p.x, p.y, p.pressure)));

  handleOnPainterSave = (lines: Line[]) => {
    localStorage.setItem(LINES_KEY, JSON.stringify(lines));
  };

  render() {
    return (
      <React.Fragment>
        <Painter
          initialLineData={this.savedLines}
          onSaveImage={this.handleOnPainterSave}
        />
      </React.Fragment>
    );
  }
}

export default App;
