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
    this.variations = parent.variations || [];
    this.next = parent.next || [];
    this.starter = parent.starter || false;
    this.ran = 0;
  }

  init(context) {
    let _context = {
      characters: (context.characters || []).concat(),
      items: (context.items || []).concat()
    }; // we're gonna break it down

    let ctx = grammar.parseContext({
      characters: [],
      items: [],
      variations: {}
    });


    // characters
    for (let characterTemplate of this.characters) {
      if (Array.isArray(characterTemplate)) {
        let matchingCharacters = _context.characters.filter((char) =>
          Situation.isValidCharacter(char, characterTemplate, _context)
        );
        if (!matchingCharacters.length) {
          if (characterTemplate.includes("optional")) {
            continue;
          }
          else {
            return false;
          }
        }
        let character = matchingCharacters.random();
        _context.characters.splice(_context.characters.indexOf(character), 1);
        ctx.characters.push(character);
      }
    }

    // items
    for (let itemTemplate of this.items) {
      if (itemTemplate.startsWith("!")) { // expression
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
          else {
            console.log("a");
            return false;
          }
        }
      }
      else {
        let item = assets.items.find((i) => i.name === itemTemplate);
        if (item) ctx.items.push(item);
        else {
          console.log("b");
          return false;
        }
      }
    }

    // variations
    for (let variation of this.variations) {
      ctx.variations[variation.name] = parser.evaluate(variation.test, ctx);
    }

    return ctx;
  } // Situation::init()

  async run(context) {
    this.ran++;
    let output = [""];

    //this.actions.forEach((actionTemplate) => this.runAction(actionTemplate, context, output));
    for (let actionTemplate of this.actions) {
      await this.runAction(actionTemplate, context, output);
    }

    output = output[0].slice(1);
    if (output.endsWith("\n")) output = output.slice(0, -1);

    if (this.next) {
      let possibilities = this.next.map((template) => {
        let situation = assets.situations.find((s) => s.name === template.name);
        let ctx = Situation.getContext(template, context);
        ctx = situation.init(ctx);
        if (ctx) {
          return [ctx, situation, template];
        }
        else return false;
      }).filter(Boolean);

      if (possibilities.length) {
        let probSum = possibilities.reduce((acc, [a, situation, template]) => acc + template.probability / (situation.ran + 1), 0);
        if (probSum > 1 || Math.random() < probSum) {
          let chosen = Math.random() * probSum;
          let n = 0;
          for (let acc = 0; acc < chosen && n < possibilities.length; n++) {
            acc += possibilities[n][2].probability / (possibilities[n][1].ran + 1);
          }
          let situation = possibilities[--n];

          let res = await situation[1].run(situation[0]);
          return output + "\n\n" + res;
        }
      }
    }
    return output;
  }

  async runAction(actionTemplate, context, output) {
    if (!actionTemplate.name && !actionTemplate.situation) {
      if (actionTemplate.if && !parser.evaluate(actionTemplate.if, context)) return;
      return output[0] += "\n";
    }
    if (actionTemplate.name) {
      let action = assets.actions.find((action) => action.name === actionTemplate.name);

      // actionTemplate.if
      if (actionTemplate.if && !parser.evaluate(actionTemplate.if, context)) return;

      let ctx = Situation.getContext(actionTemplate, context);

      // action :D
      if (action.isValid(ctx)) {
        output[0] += "\n" + action.print(ctx);
        action.applyAction(ctx);
      }
      else {
        throw new Error("Action did not match");
      }
    }
    else if (actionTemplate.situation) {
      let situation = assets.situations.find((situation) => situation.name === actionTemplate.situation);

      // actionTemplate.if
      if (actionTemplate.if && !parser.evaluate(actionTemplate.if, context)) return;

      let ctx = Situation.getContext(actionTemplate, context);

      if (ctx = situation.init(ctx)) {
        let res = await situation.run(ctx);
        output[0] += "\n\n" + res + "\n";
      }
      else {
        throw new Error("Situation did not match");
      }
    }
  } // Situation::runAction

  static getContext(template, context) {
    let ctx = grammar.parseContext({
      characters: [],
      items: [],
      others: template.others || {}
    });

    // template.characters & template.items
    function registerAsset(name) {
      if (template[name]) {
        template[name].forEach((id) => ctx[name].push(context[name][id]));
      }
    }
    registerAsset("characters");
    registerAsset("items");

    return ctx;
  }

  static isValidCharacter(char, template, context) {
    let ctx = {
      "this": char,
      ...context
    }

    return template.every((statement) => {
      if (statement === "optional") return true;
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
