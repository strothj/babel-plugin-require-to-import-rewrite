import { types as t, Visitor, NodePath } from "@babel/core";
import { isModuleExportsMemberExpression } from "./isModuleExportsMemberExpression";

export const exportUnrollVisitor: Visitor<unknown> = {
  ForOfStatement(path) {
    if (path.scope.parent !== path.scope.getProgramParent()) return;

    const left = path.get("left");
    if (!left.isVariableDeclaration()) return;

    const variableDeclarators = left.get("declarations");
    if (variableDeclarators.length !== 1) return;
    const variableDeclarator = variableDeclarators[0];

    const identifier = variableDeclarator.get("id");
    if (!identifier.isIdentifier()) return;
    const name = identifier.node.name;

    const right = path.get("right");
    if (!right.isArrayExpression()) return;

    const stringLiterals = right.get("elements");
    if (!isStringLiteralArray(stringLiterals)) return;
    const strings = stringLiterals.map(i => i.node.value);

    const blockStatement = path.get("body");
    if (!blockStatement.isBlockStatement()) return;

    const statements = blockStatement.get("body");
    for (const statement of statements.reverse()) {
      if (!statement.isExpressionStatement()) continue;

      const ae = statement.get("expression");
      if (!ae.isAssignmentExpression()) continue;

      const aeLeft = ae.get("left");
      if (!aeLeft.isMemberExpression()) continue;

      const aeLeftMemberExpression = aeLeft.get("object");
      if (!aeLeftMemberExpression.isMemberExpression()) continue;
      if (!isModuleExportsMemberExpression(aeLeftMemberExpression)) continue;

      const aeLeftIdentifier = aeLeft.get("property");
      if (Array.isArray(aeLeftIdentifier)) continue;
      if (!aeLeftIdentifier.isIdentifier()) continue;
      if (aeLeftIdentifier.node.name !== name) continue;

      const aeRight = ae.get("right");
      if (!aeRight.isMemberExpression()) continue;

      const object = aeRight.get("object");

      const objectProperty = aeRight.get("property");
      if (Array.isArray(objectProperty)) continue;
      if (!objectProperty.isIdentifier()) continue;
      if (objectProperty.node.name !== name) continue;

      const stringsToIdentifiersMap = new Map<string, t.Identifier>();
      strings.forEach(s => {
        stringsToIdentifiersMap.set(
          s,
          path.scope.getProgramParent().generateUidIdentifier(`unrolled_${s}`)
        );
      });

      statement.remove();

      path.insertAfter([
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.objectPattern(
              strings.map(s =>
                t.objectProperty(
                  t.identifier(s),
                  stringsToIdentifiersMap.get(s)!
                )
              )
            ),
            object.node
          )
        ]),
        t.exportNamedDeclaration(
          null,
          strings.map(s =>
            t.exportSpecifier(stringsToIdentifiersMap.get(s)!, t.identifier(s))
          )
        )
      ]);
    }

    if (blockStatement.get("body").length === 0) path.remove();
  }
};

function isStringLiteralArray(
  array: NodePath<any>[]
): array is NodePath<t.StringLiteral>[] {
  return !array.some(item => !item.isStringLiteral());
}
