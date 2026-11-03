import { mkdir, readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const input = new URL("../fixtures/source/styles.css", import.meta.url);
const output = new URL("../dist/styles.css", import.meta.url);
const root = postcss.parse(await readFile(input, "utf8"));

root.walkRules((rule) => {
  const selectors = selectorParser().astSync(rule.selector);
  selectors.each((selector) => {
    let isFormSelector = false;
    selector.walkClasses((node) => {
      if (node.value === "form-builder" || node.value.startsWith("form-builder-")) {
        isFormSelector = true;
      }
    });
    if (!isFormSelector) {
      selector.remove();
    }
  });
  if (selectors.nodes.length === 0) {
    rule.remove();
  } else {
    rule.selector = selectors.toString();
  }
});
root.walkComments((comment) => comment.remove());
root.walkAtRules((atRule) => {
  if (!atRule.nodes || atRule.nodes.length === 0) {
    atRule.remove();
  }
});

await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
await writeFile(output, root.toString());
console.log("Extracted scoped form CSS; original declarations and order preserved.");