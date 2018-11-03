import * as React from "react";
import { MarkdownIt } from "markdown-it";
import AutoTextarea from "./AutoTextarea";

const MARKDOWN_CLASSNAME = "markdownElement";
export { MARKDOWN_CLASSNAME };

enum EditChangeReason {
  Move,
  Escape,
  Split,
  Merge,
  Enter
}
export { EditChangeReason };

interface Props {
  md: MarkdownIt;
  content: string;
  onChange: (index: number, newContent: string) => void;
  requestEditingState: (index: number, editing: boolean) => void;
  requestMerge: (index: number, direction: number) => void;
  requestSplit: (index: number, atPosition: number) => void;
  requestMove: (index: number, direction: number) => void;
  focused: boolean;
  index: number;
  isEditing: boolean;
  mergedAt?: number;
  editChange?: EditChangeReason;
}

interface State {
  minimumHeight?: number;
}

class MarkdownElement extends React.PureComponent<Props> {
  textAreaRef = React.createRef<HTMLTextAreaElement>();
  mdRef = React.createRef<HTMLDivElement>();
  isMoving = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      isEditing: false
    };
  }

  handleOnOutsideClick = (event: MouseEvent) => {
    if (
      new RegExp(MARKDOWN_CLASSNAME).test(
        (event.target as HTMLElement).className
      )
    ) {
      // We don't want to interfere with other MarkdownElements
      return;
    }

    this.props.requestEditingState(this.props.index, false);
  };
  handleOnTextAreaClick: React.MouseEventHandler<
    HTMLTextAreaElement
  > = event => {
    // Stop propagation, so that we can detect when we have clicked outside this element
    event.stopPropagation();
  };
  handleOnClick: React.MouseEventHandler<HTMLDivElement> = event => {
    // We do not want to open if we clicked on link
    if ((event.target as HTMLElement).tagName === "A") {
      return;
    }

    // Stop propagation, so that we can detect when we have clicked outside this element
    event.stopPropagation();

    this.props.requestEditingState(this.props.index, true);
  };

  focusTextArea() {
    if (
      this.props.isEditing &&
      this.textAreaRef.current !== null &&
      document.activeElement !== this.textAreaRef.current
    ) {
      this.textAreaRef.current.focus();
    }
  }

  setCursorPosition() {
    if (
      this.props.mergedAt !== undefined &&
      this.textAreaRef.current !== null
    ) {
      this.textAreaRef.current.selectionStart = this.props.mergedAt;
      this.textAreaRef.current.selectionEnd = this.props.mergedAt;
    }
  }

  componentDidUpdate(prevProps: Props, {}, snapshot: number | null) {
    this.focusTextArea();

    if (
      prevProps.isEditing &&
      !this.props.isEditing &&
      this.props.editChange === EditChangeReason.Escape &&
      this.mdRef.current
    ) {
      this.mdRef.current.focus();
    }

    if (this.props.focused && !prevProps.focused && this.mdRef.current) {
      this.mdRef.current.focus();
    }

    if (snapshot !== null && this.textAreaRef.current !== null) {
      this.textAreaRef.current.style.minHeight = snapshot + "px";
    }

    this.setCursorPosition();
  }

  componentDidMount() {
    this.focusTextArea();
    this.setCursorPosition();
    window.addEventListener("click", this.handleOnOutsideClick);
  }
  componentWillUnmount() {
    window.removeEventListener("click", this.handleOnOutsideClick);
  }

  handleOnKeyUp: React.KeyboardEventHandler<HTMLTextAreaElement> = event => {
    if (this.textAreaRef.current === null) {
      return;
    }

    if (event.key === "Escape") {
      this.props.requestEditingState(this.props.index, false);
    }

    const selectionStart = this.textAreaRef.current.selectionStart;
    const selectionEnd = this.textAreaRef.current.selectionEnd;
    const noSelection = selectionStart === selectionEnd;
    if (event.key === "Backspace" && noSelection && selectionStart === 0) {
      // No selection and cursor on first position
      this.props.requestMerge(this.props.index, -1);
    } else if (
      event.key === "Delete" &&
      noSelection &&
      selectionStart === this.props.content.length
    ) {
      this.props.requestMerge(this.props.index, 1);
    }

    if (event.ctrlKey && event.key === "Enter") {
      this.props.requestSplit(this.props.index, selectionStart);
    }
  };

  getSnapshotBeforeUpdate() {
    if (this.mdRef.current) {
      return this.mdRef.current.scrollHeight;
    }
    return null;
  }

  handleOnKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = event => {
    if (this.textAreaRef.current === null) {
      return;
    }

    const selectionStart = this.textAreaRef.current.selectionStart;
    const selectionEnd = this.textAreaRef.current.selectionEnd;

    if (event.key === "ArrowUp" && selectionEnd === 0) {
      event.preventDefault();
      this.props.requestMove(this.props.index, -1);
    }
    if (
      event.key === "ArrowDown" &&
      selectionStart === this.props.content.length
    ) {
      event.preventDefault();
      this.props.requestMove(this.props.index, 1);
    }
  };

  handleOnChange: React.ChangeEventHandler<HTMLTextAreaElement> = event => {
    const value = event.currentTarget.value;
    this.props.onChange(this.props.index, value);
  };

  render() {
    const { md, content, isEditing, index } = this.props;

    const renderedContent = md.render(content);
    if (isEditing) {
      return (
        <div className="isFocused">
          <AutoTextarea
            value={content}
            tabIndex={index + 1}
            onChange={this.handleOnChange}
            onKeyUp={this.handleOnKeyUp}
            onKeyDown={this.handleOnKeyDown}
            onClick={this.handleOnTextAreaClick}
            ref={this.textAreaRef}
          />
        </div>
      );
    } else {
      return (
        <div
          className={MARKDOWN_CLASSNAME}
          tabIndex={index + 1}
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          onClick={this.handleOnClick}
          ref={this.mdRef}
        />
      );
    }
  }
}

export default MarkdownElement;
