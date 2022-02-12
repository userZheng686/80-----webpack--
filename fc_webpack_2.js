const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

//1.从入口文件开始 读取依赖
let entryFilePath = "./src/index.js";

//索引位置
let ID = 0;

//对文件进行加工，提取代码和索引位置和文件名
function createAsset(filename) {
  //读取file文件 es6代码
  const content = fs.readFileSync(filename, {
    encoding: "utf8",
  });

  //转换为ast代码
  const ast = parser.parse(content, {
    sourceType: "module",
  });

  //存储文件依赖
  const dependencies = [];

  //对ast代码进行分析 分析出依赖的文件 并push到文件依赖里面
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  //索引位置
  let id = ID++;

  //找出code代码
  const { code } = babel.transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env"],
  });

  return {
    filename,
    code,
    dependencies,
    id,
  };
}

//生成图 找出所有文件的依赖和相关代码
function createGraph(entry) {
  //找出主文件依赖
  const mainAsset = createAsset(entry);

  //创建队列 对依赖的文件进行加载
  const queue = [mainAsset];

  for (const asset of queue) {
    //返回文件夹目录
    const dirname = path.dirname(asset.filename);

    //建立对象 一一映射依赖的模块和模块所在数组的位置
    asset.mapping = {};

    //根据依赖关系，加载依赖的文件，并且放进队列里
    asset.dependencies.forEach((relativePath) => {
      //生成绝对路径
      const absolutePath = path.join(dirname, relativePath);

      //生成子文件
      const child = createAsset(absolutePath);

      //映射模块位置
      asset.mapping[relativePath] = child.id;

      //放进队列
      queue.push(child);
    });
  }

  return queue;
}

//根据队列 打包所有文件代码
function bundle(graph) {
  //创建module
  let modules = ``;

  graph.forEach((mod) => {
    modules += `${mod.id} : [function(require,module,exports){
            ${mod.code}
        },${JSON.stringify(mod.mapping)}],`;
  });

  const result = `
        (function(modules){
            function require(id){
                let [fn,mapping] = modules[id] 
                
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
  console.log(result);
}

const graph = createGraph(entryFilePath);
bundle(graph);
