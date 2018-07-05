"use strict";
const exprEval = require("expr-eval");
const parser = new exprEval.Parser();
const Item = require("./item");
const grammar = require("./grammar");
const assets = require("./assets");


const Situation = module.exports = class Situation {
  constructor(parent) {
    this.name = parent.name;
    this.characters = parent.characters || [];
    this.items = parent.items || [];
    this.actions = parent.actions || [];
  }

  init(context) {
    let _context = {
      characters: (context.characters || []).concat(),
      items: (context.items || []).concat()
    }; // we're gonna break it down

    let ctx = grammar.parseContext({
      characters: [],
      items: []
    });


    // characters
    for (let characterTemplate of this.characters) {
      if (Array.isArray(characterTemplate)) {
        let matchingCharacters = _context.characters.filter((char) =>
          Situation.isValidCharacter(char, characterTemplate, _context)
        );
        if (!matchingCharacters.length) {
          return false;
        }
        let character = matchingCharacters.random();
        _context.characters.splice(_context.characters.indexOf(character), 1);
        ctx.characters.push(character);
      }
    }

    // items
    for (let itemTemplate of this.items) {
      if (itemTemplate.startsWith("!")) {
        let item = parser.evaluate(itemTemplate.slice(1), ctx);

        if (Array.isArray(item)) {
          item = item.random();
        }

        if (item instanceof Item) {
          ctx.items.push(item);
        }
        else if (typeof item === "string") {
          item = assets.items.find((i) => i.name === item);
          if (item) ctx.items.push(item);
          else return false;
        }
      }
      else {
        let item = assets.items.find((i) => i.name === itemTemplate);
        if (item) ctx.items.push(item);
        else return false;
      }
    }

    return ctx;
  } // Situation::init()

  run(context) {
    let output = "";
    this.actions.forEach((actionTemplate) => {
      let action = assets.actions.find((action) => action.name === actionTemplate.name);

      // actionTemplate.if
      if (actionTemplate.if && !parser.evaluate(actionTemplate.if, context)) return;

      let ctx = grammar.parseContext({
        characters: [],
        items: [],
        ...(actionTemplate.others || {})
      });

      // actionTemplate.characters & actionTemplate.items
      function registerAsset(name) {
        if (actionTemplate[name]) {
          actionTemplate[name].forEach((id) => ctx[name].push(context[name][id]));
        }
      }
      registerAsset("characters");
      registerAsset("items");

      // action :D
      if (action.isValid(ctx)) {
        output += "\n" + action.print(ctx);
        action.applyAction(ctx);
      }
      else {
        throw new Error("Action did not match");
      }
    });

    return output.slice(1);
  }

  static isValidCharacter(char, template, context) {
    let ctx = {
      "this": char,
      ...context
    }

    return template.every((statement) => {
      let words = statement.split(":");
      if (words.length === 1) {
        return parser.evaluate(words[0], ctx);
      }
      if (words.length === 2) {
        let a = parser.evaluate(words[0], ctx);
        let b = parser.evaluate(words[1], ctx);
        if (typeof a === "function") {
          return a(b);
        }
        else if (Array.isArray(a) && typeof b === "number") {
          return a.length >= b;
        }
      }
    });
  }
}
