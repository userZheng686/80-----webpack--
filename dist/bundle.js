
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
      })({0 : [
            function (require,module,exports) {
                "use strict";

var _info = require("./info.js");

console.log(_info.info);
            },
            {"./info.js":1}
        ],1 : [
            function (require,module,exports) {
                "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.info = void 0;

var _consts = require("./consts.js");

var info = {
  name: 'js'
};
exports.info = info;
            },
            {"./consts.js":2}
        ],2 : [
            function (require,module,exports) {
                "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Info = void 0;
var Info = 'Hello';
exports.Info = Info;
            },
            {}
        ],})
    