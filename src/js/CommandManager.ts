import { Hook } from "./utils";

type CommandName = string;
type Listener = (...args: any[]) => any;

export default class CommandManager {
  private listeners: Map<CommandName, Listener[]> = new Map();

  public on(command: CommandName, listener: Listener) {
    let allListeners = this.listeners.get(command);

    if (allListeners === undefined) {
      allListeners = [] as Listener[];
      this.listeners.set(command, allListeners);
    }

    allListeners.push(listener);
  }

  public off(command: CommandName, listener: Listener) {
    const allListeners = this.listeners.get(command);

    if (allListeners !== undefined) {
      const newListeners = allListeners.filter(l => l !== listener);
      this.listeners.set(command, newListeners);
    } else {
      throw "The command have no hooks registred. Perhaps a typo?";
    }
  }

  public dispatch(command: CommandName, ...args: any[]) {
    const allListeners = this.listeners.get(command);

    if (allListeners !== undefined) {
      for (const listener of allListeners) {
        listener(...args);
      }
    }
  }

  private CommandManager() {}

  private static instance: CommandManager | null = null;
  public static get Instance(): CommandManager {
    if (CommandManager.instance === null) {
      CommandManager.instance = new CommandManager();
    }

    return CommandManager.instance;
  }
}
