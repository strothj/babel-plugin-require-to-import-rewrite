import { types } from "@babel/core";

interface Test {
  thing: string;
}

it("does something", () => {
  const test: Test = {
    thing: "1"
  };

  console.log(test);
  console.log(types.anyTypeAnnotation);
});
