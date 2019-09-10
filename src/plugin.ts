import nodeFS from "fs";
import nodePath from "path";
import {
  types as t,
  parse,
  traverse,
  PluginObj,
  Visitor,
  NodePath
} from "@babel/core";

interface FilenameState {
  file: { opts: { filename: string } };
}

export function plugin(): PluginObj<FilenameState> {
  return {
    name: "babel-plugin-require-to-import-rewrite",
    visitor
  };
}

const visitor: Visitor<FilenameState> = {
  Program(path) {
    path.traverse(requireRewriteVisitor, {
      file: this.file,
      requirePathToIdentifierMap: new Map(),
      nextImportDeclarationLine: 0
    });
  }
};

interface RequireRewriteVisitorState extends FilenameState {
  requirePathToIdentifierMap: Map<string, t.Identifier>;
  nextImportDeclarationLine: number;
}

const requireRewriteVisitor: Visitor<RequireRewriteVisitorState> = {
  CallExpression(path) {
    const callee = path.get("callee");
    if (!callee.isIdentifier() || callee.node.name !== "require") return;

    const args = path.get("arguments");
    if (args.length !== 1) {
      throw path.buildCodeFrameError("Expected single argument.");
    }

    const arg = args[0];
    if (!arg.isStringLiteral()) {
      throw arg.buildCodeFrameError("Expected string literal.");
    }

    const requirePath = arg.node.value;

    // Add import statement to the top of the file.
    if (!this.requirePathToIdentifierMap.has(requirePath)) {
      // Generate a unique variable name for the import.
      const programScope = path.scope.getProgramParent();
      const importNameIdentifier = programScope.generateUidIdentifier(
        `import_${requirePath}`
      );
      this.requirePathToIdentifierMap.set(requirePath, importNameIdentifier);

      const isRelative = requirePath.startsWith(".");
      let shouldImportAsNamespace = isRelative;

      if (isRelative) {
        shouldImportAsNamespace = shouldImportRelativeModuleUsingNamespace({
          currentFilename: this.file.opts.filename,
          requirePath,
          errorPath: arg
        });
      }

      const importBuilder = shouldImportAsNamespace
        ? t.importNamespaceSpecifier
        : t.importDefaultSpecifier;
      const importDeclaration = t.importDeclaration(
        [importBuilder(importNameIdentifier)],
        t.stringLiteral(requirePath)
      );

      const program = programScope.path;
      if (!program.isProgram()) {
        throw program.buildCodeFrameError("Expected program.");
      }

      program.node.body = [
        ...program.node.body.slice(0, this.nextImportDeclarationLine),
        importDeclaration,
        ...program.node.body.slice(this.nextImportDeclarationLine)
      ];
      this.nextImportDeclarationLine += 1;
    }

    // Replace require with reference to the import statement.
    path.replaceWith(this.requirePathToIdentifierMap.get(requirePath)!);
  }
};

interface ShouldImportRelativeModuleUsingNamespaceOptions {
  currentFilename: string;
  requirePath: string;
  errorPath: NodePath<unknown>;
}

/**
 * Parses the relative module which was required and returns whether or not it
 * should be imported using a namespace style import.
 */
function shouldImportRelativeModuleUsingNamespace({
  currentFilename,
  requirePath,
  errorPath
}: ShouldImportRelativeModuleUsingNamespaceOptions) {
  let filename: string;
  try {
    filename = require.resolve(
      nodePath.join(nodePath.dirname(currentFilename), requirePath)
    );
  } catch {
    // If the file does not exist, fall back to importing it using a default
    // import.
    return false;
  }

  const code = nodeFS.readFileSync(filename, "utf8");
  const ast = parse(code, { filename, babelrc: false });
  if (!ast) throw errorPath.buildCodeFrameError("Failed to parse.");

  let result: "default" | "namespace" | null = null;
  traverse(ast, {
    MemberExpression(path) {
      if (!isModuleExportsMemberExpression(path)) return;

      const assignmentExpression = path.parentPath;
      if (!assignmentExpression.isAssignmentExpression()) return;

      const right = assignmentExpression.get("right");
      if (right.isObjectExpression()) {
        result = "namespace";
        return;
      }

      if (right.isIdentifier()) {
        result = "default";
        return;
      }
    }
  });

  if (!result) {
    throw errorPath.buildCodeFrameError("Unable to determine export type.");
  }

  return result === "namespace";
}

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
