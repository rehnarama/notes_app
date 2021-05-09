import * as React from "react";
import Pen from "../Pen/Pen";

import fluorescentPenSrc from "url:../images/fluorescent_pen.svg";
import feltPenSrc from "url:../images/felt_pen.svg";
import classes from "./PenPicker.scss";
import "./PenPicker.scss";
import FeltPen from "../Pen/FeltPen";
console.log(classes);

interface Props {
  onPenChanged: (pen: Pen) => void;
  style: React.CSSProperties | undefined;
  className: string;
}

interface State {
  pen: typeof Pen;
}

export default class PenPicker extends React.PureComponent<Props, State> {
  state = {
    pen: FeltPen
  };

  render() {
    const { className, style } = this.props;
    const { pen: selectedPen } = this.state;
    return (
      <menu style={style} className={classes.container}>
        <img width={50} src={fluorescentPenSrc} />
        <img width={50} src={feltPenSrc} />
      </menu>
    );
  }
}
