// This Babel config is for the Jest test environment itself. It is not used in
// the Babel instances within the unit tests themselves.
module.exports = {
  presets: [
    [require.resolve("@babel/preset-env"), { targets: { node: "current" } }],
    require.resolve("@babel/preset-typescript")
  ]
};
