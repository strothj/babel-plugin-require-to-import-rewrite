import { PluginObj, Visitor } from "@babel/core";
import { FilenameVisitorState } from "./FilenameVisitorState";
import { requireRewriteVisitor } from "./requireRewriteVisitor";
import { exportUnrollVisitor } from "./exportUnrollVisitor";
import { exportObjectVisitor } from "./exportObjectVisitor";

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

    // Replace exports.
    path.traverse(exportVisitor);
  }
};

const exportVisitor: Visitor<unknown> = {
  ExpressionStatement(path) {
    const assignmentExpression = path.get("expression");
    if (!assignmentExpression.isAssignmentExpression()) return;

    if (assignmentExpression.get("right").isObjectExpression()) {
      path.traverse(exportObjectVisitor);
      return;
    }
  }
};
