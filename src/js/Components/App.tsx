import * as React from "react";
import Painter from "./Painter";
import { Color } from "../Lines/LineRenderer";
import Toolbar from "./Toolbar";
import classes from "./App.module.css";
import { FullMeshNetwork } from "network";
import Lines from "../Lines/Lines";

const fmn = new FullMeshNetwork("wss://rehnarama-notes.glitch.me");
const lines = new Lines(fmn);

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
      <Painter color={color} thickness={thickness} lines={lines} />
    </main>
  );
};

export default App;
