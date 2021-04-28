import * as React from "react";
import Painter from "./Painter";
import { Color } from "../Lines/LineRenderer";
import Toolbar from "./Toolbar";
import classes from "./App.module.css";
import { FullMeshNetwork } from "network";
import Lines from "../Data/Lines/Lines";
import useHash from "../Hooks/useHash";
import ShortcutRecognizer from "../ShortcutRecognizer";
import CommandManager from "../CommandManager";
import UserList from "../Data/Users/UserList";
import { Provider as DataProvider } from "../Data/DataContext";
import useSingleton from "../Hooks/useSingleton";
import Drawer from "./Drawer";

const SIGNALLING_URL = "wss://notes-signalling.herokuapp.com";

const App: React.FC = () => {
  const { hash, setHash } = useHash();
  const [rtcToken, setRtcToken] = React.useState<any>();
  const fmn = useSingleton(() => new FullMeshNetwork(SIGNALLING_URL));
  const lines = useSingleton(() => new Lines(fmn));
  const userList = useSingleton(() => new UserList(fmn));
  const shortcutRecognizer = useSingleton(() => new ShortcutRecognizer());

  React.useEffect(() => {
    async function fetchToken() {
      const response = await fetch(
        "https://q4q0hqrcx3.execute-api.eu-north-1.amazonaws.com/twilio-turn-get-token",
        { mode: "cors" }
      );

      const token: RTCConfiguration = await response.json();
      setRtcToken(token);
    }

    fetchToken();
  }, []);

  React.useEffect(() => {
    if (rtcToken !== undefined) {
      fmn.rtcConfiguration = { iceServers: rtcToken.ice_servers };
    }
  }, [rtcToken]);

  /**
   * Here we bind shortcuts to commands
   */
  React.useEffect(() => {
    shortcutRecognizer.create("Delete").add(() => {
      CommandManager.Instance.dispatch("delete");
    });
  }, [shortcutRecognizer]);

  React.useEffect(() => {
    if (
      rtcToken !== undefined &&
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
  }, [hash, lines, fmn, userList, rtcToken]);

  const [cursorMode, setCursorMode] = React.useState(true);
  const [eraseMode, setEraseMode] = React.useState(false);
  const [color, setColor] = React.useState<Color>([0, 0, 0, 1]);
  const [thickness, setThickness] = React.useState(1);

  return (
    <DataProvider value={{ userList, lines }}>
      <main className={classes.main}>
        <header>
          <Drawer>
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
          </Drawer>
        </header>
        <Painter
          color={color}
          thickness={thickness}
          lines={lines}
          eraseMode={eraseMode}
          cursorMode={cursorMode}
        />
      </main>
    </DataProvider>
  );
};

export default App;
