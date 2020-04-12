import * as React from "react";
import Painter, { Line, Point } from "./Painter";
import { Color } from "../Lines/LineRenderer";
import Toolbar from "./Toolbar";
import classes from "./App.module.css";

const App: React.SFC = () => {
  const [color, setColor] = React.useState<Color>([0, 0, 0, 1]);
  const [thickness, setThickness] = React.useState(1);

  return (
    <main className={classes.main}>
      <header>
        <Toolbar
          onColorChange={setColor}
          onThicknessChange={setThickness}
          thickness={thickness}
          color={color}
        />
      </header>
      <Painter color={color} thickness={thickness} />
    </main>
  );
};

export default App;
