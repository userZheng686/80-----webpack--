const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let Id = 0;

function createAsset(filename) {
  const content = fs.readFileSync(filename, {
    encoding: "utf8",
  });

  const ast = parser.parse(content, {
    sourceType: "module",
  });

  const dependenices = [];

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependenices.push(node.source.value);
    },
  });

  let id = Id++;

  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env"],
  });

  return {
    filename,
    code,
    id,
    dependenices,
  };
}

function createGraph(entry) {
  const mainAsset = createAsset(entry);

  const queue = [mainAsset];

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);

    asset.mapping = {};

    asset.dependenices.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);

      const child = createAsset(absolutePath);

      asset.mapping[relativePath] = child.id;

      queue.push(child);
    });
  }

  return queue;
}

function bundle(graph) {
  let modules = ``;

  graph.forEach((mod) => {
    modules += `${mod.id} : [
            function (require,module,exports) {
                ${mod.code}
            },
            ${JSON.stringify(mod.mapping)}
        ],`;
  });

  const result = `
      (function(modules){
        function require(id) {
            const [fn,mapping] = modules[id]
            
            function localRequire(relativePath){
                return require(mapping[relativePath])
            }

            const module = {
                exports : {}
            }

            fn(localRequire,module,module.exports)

            return module.exports
        }

        require(0)
      })({${modules}})
    `;

  return result;
}

const graph = createGraph("./src/index.js");
const result = bundle(graph);
if (result) {
  fs.writeFileSync("./dist/bundle.js", result);
}
console.log(result);
