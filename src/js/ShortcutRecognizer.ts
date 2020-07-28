import { Hook } from "./utils";

enum Modifier {
  Alt,
  Ctrl,
  Shift
}
interface Shortcut {
  modifiers: Modifier[];
  key: string;
}
type KeyCombination = string;

export default class ShortcutRecognizer {
  private element: HTMLElement;

  private shortcuts: Map<KeyCombination, Hook<() => void>> = new Map();

  constructor(element: HTMLElement = window.document.body) {
    this.element = element;

    this.element.addEventListener("keydown", this.handleOnKeyDown);
  }
  dispose() {
    this.element.removeEventListener("keydown", this.handleOnKeyDown);
  }

  private handleOnKeyDown = (e: KeyboardEvent) => {
    for (const [combination, hook] of this.shortcuts) {
      const shortcut = this.parseKeyCombination(combination);
      let isValid = e.key.toLowerCase() === shortcut.key.toLowerCase();

      for (const modifier of shortcut.modifiers) {
        if (modifier === Modifier.Ctrl) {
          isValid = isValid && e.ctrlKey;
        } else if (modifier === Modifier.Shift) {
          isValid = isValid && e.shiftKey;
        } else if (modifier === Modifier.Alt) {
          isValid = isValid && e.altKey;
        }
      }

      if (isValid) {
        hook.call();
        e.preventDefault();
        break;
      }
    }
  };

  public create(combination: KeyCombination): Hook<() => void> {
    if (this.shortcuts.has(combination)) {
      return this.shortcuts.get(combination) as Hook<() => void>;
    } else {
      const hook = new Hook();
      this.shortcuts.set(combination, hook);
      return hook;
    }
  }

  private parseModifier(modifier: string): Modifier {
    switch (modifier.toLowerCase()) {
      case "ctrl":
        return Modifier.Ctrl;
      case "shift":
        return Modifier.Shift;
      case "alt":
        return Modifier.Alt;
      default:
        throw `${modifier} is not a valid modifier`;
    }
  }

  private parseKeyCombination(combination: KeyCombination): Shortcut {
    const elements = combination.split("+");
    const modifiers: Modifier[] = [];

    if (elements.length === 0) {
      throw "Empty combination is not allowed as a shortcut";
    }

    // Since the last element should be the key
    while (elements.length > 1) {
      modifiers.push(this.parseModifier(elements.shift() as string));
    }

    return {
      modifiers,
      key: elements.shift() as string
    };
  }
}
