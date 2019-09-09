import { PluginObj } from "@babel/core";

export function plugin(): PluginObj<unknown> {
  return {
    visitor: {}
  };
}
