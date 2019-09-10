/// <reference path="./typings/babel-plugin-tester.d.ts" />
import nodePath from "path";
import pluginTester from "babel-plugin-tester";
import { plugin } from "./plugin";

const fixturesDirectory = nodePath.join(__dirname, "./__fixtures__");

pluginTester({
  plugin,
  babelOptions: {
    // This needs to be set to properly ignore the root "babel.config.js".
    root: fixturesDirectory
  },
  fixtures: fixturesDirectory,
  snapshot: true
});
