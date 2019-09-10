import { PluginObj, Visitor } from "@babel/core";
import { FilenameVisitorState } from "./FilenameVisitorState";
import { requireRewriteVisitor } from "./requireRewriteVisitor";
import { exportUnrollVisitor } from "./exportUnrollVisitor";

export function plugin(): PluginObj<FilenameVisitorState> {
  return {
    name: "babel-plugin-require-to-import-rewrite",
    visitor: rootVisitor
  };
}

const rootVisitor: Visitor<FilenameVisitorState> = {
  Program(path) {
    // Replace requires with imports.
    path.traverse(requireRewriteVisitor, {
      file: this.file,
      requirePathToIdentifierMap: new Map(),
      nextImportDeclarationLine: 0
    });

    // Unroll export loops.
    path.traverse(exportUnrollVisitor);
  }
};
