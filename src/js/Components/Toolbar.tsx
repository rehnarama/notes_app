import * as React from "react";
import ColorPicker, { PickFunction } from "./ColorPicker";
import classes from "./Toolbar.module.css";
import LineRenderer, { Color } from "../Lines/LineRenderer";
import LineGenerator from "../Lines/LineGenerator";
import FeltPen from "../Pen/FeltPen";

import ImageCheckbox from "./ImageCheckbox";

import CursorModeImg from "../../images/cursormode.svg?url";
import EraserModeImg from "../../images/eraser.svg?url";
import useHash from "../Hooks/useHash";
import GLApp from "../GLApp";
import UserListContainer from "./UserList/UserListContainer";
import Canvas from "../Rendering/Canvas";

const chars = "abcdefghijklmnopqrstuvwxyz1234567890";
function randomString(length: number) {
  const arr = new Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = chars[Math.floor(Math.random() * chars.length)];
  }
  return arr.join("");
}

interface Props {
  onColorChange?: PickFunction;
  onThicknessChange?: (thickness: number) => void;
  onCursorModeChange?: (alwaysDraw: boolean) => void;
  onEraseModeChange?: (erase: boolean) => void;
  thickness: number;
  color: Color;
  cursorMode: boolean;
  eraseMode: boolean;
}

const Toolbar: React.SFC<Props> = props => {
  const { hash, setHash } = useHash();

  const onThicknessChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    props.onThicknessChange?.(e.currentTarget.valueAsNumber);
  };
  let previewRenderer = React.useRef<LineRenderer | null>(null);
  const attachRenderer = React.useCallback((node: HTMLDivElement) => {
    const glApp = new GLApp(node);
    previewRenderer.current = glApp.addProgram(
      new LineRenderer(glApp, new Canvas(glApp))
    );
  }, []);

  React.useEffect(() => {
    function updatePreview() {
      if (previewRenderer.current) {
        const generator = new LineGenerator(FeltPen, true);
        const width = previewRenderer.current.glApp.width;
        const height = previewRenderer.current.glApp.height;
        generator.addLine(0, {
          points: [
            { pressure: 0.8, x: props.thickness * 5, y: props.thickness * 5 },
            { pressure: 0.6, x: width * 0.4, y: height * 0.9 },
            { pressure: 0.5, x: width * 0.6, y: height * 0.2 },
            {
              pressure: 0.2,
              x: width - props.thickness * 5,
              y: height - props.thickness * 5
            }
          ],
          color: props.color,
          thickness: props.thickness
        });

        previewRenderer.current.loadData(generator);
      }
    }
    updatePreview();

    previewRenderer.current?.glApp.onSizeChange.add(updatePreview);

    return () => {
      previewRenderer.current?.glApp.onSizeChange.remove(updatePreview);
    };
  }, [props.color, props.thickness, previewRenderer.current]);

  const onCursorModeChange = (checked: boolean) => {
    props.onCursorModeChange?.(checked);
  };
  const onEraseModeChange = (checked: boolean) => {
    props.onEraseModeChange?.(checked);
  };

  const inviteCollaborator = () => {
    if (hash.length === 0) {
      setHash(randomString(10));
    }
  };

  return (
    <div className={classes.content}>
      <div className={classes.canvasPreview} ref={attachRenderer} />
      <ColorPicker
        onPick={props.onColorChange}
        className={classes.colorPicker}
      />
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.2"
        value={props.thickness}
        onChange={onThicknessChange}
      ></input>
      <div>
        <ImageCheckbox
          src={CursorModeImg}
          id="mode-cursor-mobile"
          width={32}
          height={32}
          checked={props.cursorMode}
          onChange={onCursorModeChange}
          className={classes.cursorCheckbox}
        ></ImageCheckbox>
        <ImageCheckbox
          src={EraserModeImg}
          id="mode-eraser-mobile"
          width={32}
          height={32}
          checked={props.eraseMode}
          onChange={onEraseModeChange}
        ></ImageCheckbox>
      </div>
      {hash.length > 0 ? (
        <React.Fragment>
          <label>Invite URL:</label>
          <input
            type="text"
            value={location.href}
            readOnly
            style={{
              width: `${location.href.length}ch`
            }}
          />
        </React.Fragment>
      ) : (
        <button onClick={inviteCollaborator}>Invite Collaborator</button>
      )}

      <UserListContainer />
    </div>
  );
};

export default Toolbar;
