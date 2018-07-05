const fs = require("fs");
const path = require("path");

module.exports = {};

const Item = require("./item");
const Action = require("./action");
const Situation = require("./situation");

const serializable = {
  items: Item,
  actions: Action,
  situations: Situation
}



let assetsDirectory = fs.readdirSync(path.resolve(process.cwd(), "./assets/"))
  .map((dir) => {
    let p = path.resolve(process.cwd(), "./assets/", dir);
    let stats = fs.lstatSync(p);
    if (stats.isDirectory()) {
      let files = fs.readdirSync(p);
      let res = {};
      files.filter((subdir) => subdir.endsWith(".json")).forEach((subdir) => {
        res[subdir.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(p, subdir)));
      });
      return res;
    }
  })
  .filter(Boolean)
  .forEach(load);

serialize();

function load(data) {
  function step(parent, child) {
    let keys = Object.keys(child);
    for (key of keys) {
      if (!parent[key]) {
        parent[key] = child[key];
      }
      else if (Array.isArray(parent[key]) && Array.isArray(child[key])) {
        parent[key] = parent[key].concat(child[key]);
      }
      else {
        step(parent[key], child[key]);
      }
    }
  }
  step(module.exports, data);
}

function serialize() {
  for (key in module.exports) {
    if (serializable[key]) {
      module.exports[key] = module.exports[key].map((thing) => new serializable[key](thing));
    }
  }
}

module.exports.serialize = serialize;
