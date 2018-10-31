import { MarkdownIt as mit } from "markdown-it";

export = MarkdownIt;
export as namespace markdownit;

declare module MarkdownIt {
  type MarkdownItPlugin = (md: MarkdownIt, ...params: any[]) => void;
  interface MarkdownIt extends mit {
    use(plugin: MarkdownItPlugin, ...params: any[]): MarkdownIt;
  }
}
