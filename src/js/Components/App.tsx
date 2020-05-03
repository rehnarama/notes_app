import * as React from "react";
import Painter from "./Painter";
import { Color } from "../Lines/LineRenderer";
import Toolbar from "./Toolbar";
import classes from "./App.module.css";
import { FullMeshNetwork } from "network";
import Lines from "../Lines/Lines";
import useHash from "./useHash";

const SIGNALLING_URL = "ws://localhost:8080";

const App: React.SFC = () => {
  const { hash } = useHash();
  const fmn = React.useRef(new FullMeshNetwork(SIGNALLING_URL));
  const lines = React.useRef(new Lines(fmn.current));

  React.useEffect(() => {
    if (hash.length > 0) {
      fmn.current.joinRoom(hash);
    }
  }, [hash]);

  const [cursorMode, setCursorMode] = React.useState(true);
  const [eraseMode, setEraseMode] = React.useState(false);
  const [color, setColor] = React.useState<Color>([0, 0, 0, 1]);
  const [thickness, setThickness] = React.useState(1);

  return (
    <main className={classes.main}>
      <header>
        <Toolbar
          onColorChange={setColor}
          onThicknessChange={setThickness}
          onCursorModeChange={setCursorMode}
          onEraseModeChange={setEraseMode}
          thickness={thickness}
          color={color}
          eraseMode={eraseMode}
          cursorMode={cursorMode}
        />
      </header>
      <Painter
        color={color}
        thickness={thickness}
        lines={lines.current}
        eraseMode={eraseMode}
        cursorMode={cursorMode}
      />
    </main>
  );
};

export default App;
