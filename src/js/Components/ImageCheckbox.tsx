import * as React from "react";
import classNames from "classnames";
import classes from "./ImageCheckbox.module.css";

export interface Props {
  checked: boolean;
  src: string;
  id: string;
  width: number;
  height: number;
  className?: string;
  onChange?: (checked: boolean) => void;
}

const ImageCheckbox: React.SFC<Props> = props => {
  const onChange = React.useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    e => {
      props.onChange?.(e.currentTarget.checked);
    },
    [props.onChange]
  );

  return (
    <label htmlFor={props.id} className={classNames(classes.container, props.className)}>
      <input
        id={props.id}
        type="checkbox"
        checked={props.checked}
        onChange={onChange}
      />
      <img src={props.src} width={props.width} height={props.height} />
    </label>
  );
};

export default ImageCheckbox;
