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
  const [alwaysDraw, setAlwaysDraw] = React.useState(true);
  const [erase, setErase] = React.useState(false);
  const [color, setColor] = React.useState<Color>([0, 0, 0, 1]);
  const [thickness, setThickness] = React.useState(1);

  return (
    <main className={classes.main}>
      <header>
        <Toolbar
          onColorChange={setColor}
          onThicknessChange={setThickness}
          onAlwaysDrawChange={setAlwaysDraw}
          onEraseChange={setErase}
          thickness={thickness}
          color={color}
          erase={erase}
          alwaysDraw={alwaysDraw}
        />
      </header>
      <Painter
        color={color}
        thickness={thickness}
        lines={lines}
        erase={erase}
        alwaysDraw={alwaysDraw}
      />
    </main>
  );
};

export default App;
