declare module "babel-plugin-tester" {
  import { PluginTarget } from "@babel/core";

  /**
   * @see https://github.com/babel-utils/babel-plugin-tester#options
   */
  export interface PluginTesterOptions extends TestItemObject {
    plugin: PluginTarget;
    pluginName?: string;
    pluginOptions?: object;
    babelOptions?: object;
    title?: string;
    filename?: string;
    /**
     * @default "lf"
     */
    endOfLine?: "lf" | "crlf" | "auto" | "preserve";
    fixtures?: string;
    tests?: TestItem[];
    babel?: unknown;
  }

  export type TestItem = string | TestItemObject;

  /**
   * @see https://github.com/babel-utils/babel-plugin-tester#test-objects
   */
  export interface TestItemObject {
    code?: string;
    title?: string;
    output?: string;
    fixture?: string;
    outputFixture?: string;
    only?: boolean;
    skip?: boolean;
    snapshot?: boolean;
    error?: boolean | string | RegExp | Error | ((err: Error) => boolean);
    setup?: () =>
      | void
      | (() => void)
      | Promise<void>
      | Promise<() => void | Promise<void>>;
    teardown?: () => void | Promise<void>;
    formatResult?: (result: string) => string;
  }

  export default function pluginTester(options: PluginTesterOptions): void;
}
