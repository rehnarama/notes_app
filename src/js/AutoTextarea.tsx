import * as React from "react";

type TextAreaProps = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;
type TextAreaPropsWithoutRef = Pick<
  TextAreaProps,
  Exclude<keyof TextAreaProps, "ref">
>;

type Props = TextAreaPropsWithoutRef;

class AutoTextarea extends React.PureComponent<
  Props & { forwardedRef: React.Ref<HTMLTextAreaElement> | undefined }
> {
  componentDidMount() {
    this.autofitTextArea();
  }

  componentDidUpdate() {
    this.autofitTextArea();
  }

  autofitTextArea = () => {
    const reactRef = this.props.forwardedRef as React.RefObject<
      HTMLTextAreaElement
    >;
    if (reactRef.current !== null) {
      reactRef.current.style["height"] =
        reactRef.current.scrollHeight + "px";
    }
  };

  render() {
    const { forwardedRef: ref, ...props } = this.props;

    return <textarea ref={ref} {...props} />;
  }
}

export default React.forwardRef<HTMLTextAreaElement, Props>((props, ref) => (
  <AutoTextarea forwardedRef={ref} {...props} />
));
