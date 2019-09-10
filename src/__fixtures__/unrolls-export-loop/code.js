for (let name of [
  "canUndo",
  "canRedo",
  "getObjectId",
  "getObjectById",
  "getActorId",
  "setActorId",
  "getConflicts",
  "Text",
  "Table",
  "Counter"
]) {
  module.exports[name] = Frontend[name];
}
