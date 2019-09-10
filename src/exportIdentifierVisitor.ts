import { types as t, Visitor } from "@babel/core";
import { isModuleExportsMemberExpression } from "./isModuleExportsMemberExpression";

export const exportIdentifierVisitor: Visitor<unknown> = {
  AssignmentExpression(path) {
    const left = path.get("left");
    if (!left.isMemberExpression()) return;
    if (!isModuleExportsMemberExpression(left)) return;

    const right = path.get("right");
    if (!right.isIdentifier()) return;

    path.parentPath.replaceWith(t.exportDefaultDeclaration(right.node));
  }
};
