import { types as t, NodePath } from "@babel/core";

/**
 * Returns whether or not the member expression is `module.exports`.
 */
export function isModuleExportsMemberExpression(
  path: NodePath<t.MemberExpression>
) {
  const objectPath = path.get("object");
  if (!objectPath.isIdentifier({ name: "module" })) return false;

  const propertyPath = path.get("property");
  if (
    Array.isArray(propertyPath) ||
    !propertyPath.isIdentifier({ name: "exports" })
  ) {
    return false;
  }

  return true;
}
