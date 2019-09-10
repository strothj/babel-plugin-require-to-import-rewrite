import { types as t, Visitor } from "@babel/core";
import { isModuleExportsMemberExpression } from "./isModuleExportsMemberExpression";

export const exportObjectVisitor: Visitor<unknown> = {
  AssignmentExpression(path) {
    if (path.scope !== path.scope.getProgramParent()) return;

    const left = path.get("left");
    if (!left.isMemberExpression()) return;
    if (!isModuleExportsMemberExpression(left)) return;

    const right = path.get("right");
    if (!right.isObjectExpression()) return;

    for (const objectProperty of right.get("properties")) {
      if (!objectProperty.isObjectProperty()) continue;

      const value = objectProperty.get("value");
      if (!value.isIdentifier()) continue;

      path.insertBefore(
        t.exportNamedDeclaration(null, [
          t.exportSpecifier(value.node, objectProperty.node.key)
        ])
      );

      objectProperty.remove();
    }

    if (right.get("properties").length === 0) path.parentPath.remove();
  }
};
