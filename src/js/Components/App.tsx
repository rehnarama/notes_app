import * as React from "react";
import Painter from "./Painter";
import { Color } from "../Lines/LineRenderer";
import Toolbar from "./Toolbar";
import classes from "./App.module.css";
import { FullMeshNetwork } from "network";
import Lines from "../Lines/Lines";
import useHash from "./useHash";
import ShortcutRecognizer from "../ShortcutRecognizer";
import CommandManager from "../CommandManager";

const SIGNALLING_URL = "wss://notes-signalling.herokuapp.com";
const fmn = new FullMeshNetwork(SIGNALLING_URL);
const lines = new Lines(fmn);

const App: React.SFC = () => {
  const { hash, setHash } = useHash();
  const shortcutRef = React.useRef(new ShortcutRecognizer());
  const shortcutRecognizer = shortcutRef.current;

  /**
   * Here we bind shortcuts to commands
   */
  React.useEffect(() => {
    shortcutRecognizer.create("Delete").add(() => {
      CommandManager.Instance.dispatch("delete");
    });
  }, [ShortcutRecognizer]);

  React.useEffect(() => {
    if (
      hash.length > 0 &&
      lines !== null &&
      fmn !== null &&
      hash !== fmn.currentRoomId
    ) {
      if (fmn.currentRoomId !== undefined && lines.getLines().size > 0) {
        const leave = window.confirm(
          "All changes will be deleted if you change room. Do you want to continue?"
        );
        if (!leave) {
          setHash(fmn.currentRoomId);
          return;
        }
      }

      if (fmn.currentRoomId !== undefined) {
        fmn.close();
        for (const [id, _] of lines.getLines()) {
          lines.removeLine(id);
        }
      }

      fmn.joinRoom(hash);
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
        lines={lines}
        eraseMode={eraseMode}
        cursorMode={cursorMode}
      />
    </main>
  );
};

export default App;
