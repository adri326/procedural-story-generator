"use strict";
const exprEval = require("expr-eval");

const Character = require("./character");
const Item = require("./item");
const Action = require("./action");
const Situation = require("./situation");

const uppercase = module.exports.uppercase = function uppercase(string) {
  return string.replace(
    /(?<=^|\W)(\w)/g, // first letter of string or word
    (bit) => bit.toUpperCase()
  );
};

const pronouns = module.exports.pronouns = [
  ["he", "him", "his"],
  ["she", "her", "her"],
  ["they", "them", "their"]
];

const verbs = module.exports.verbs = {
  "be": ["am", "are", "is", "are", "are", "are"],
  "have": ["have", "has"],
  "do": ["do", "does"]
}

const conjugate = module.exports.conjugate = function conjugate(infinitive, context) {
  if (typeof context === "number") {
    if (context === 0 || context === 1) {
      context = {
        plural: false,
        person: 3
      };
    }
    else {
      context = {
        plural: true,
        person: 3
      }
    }
  }

  let verb = verbs[infinitive];
  if (verb && verb.length === 6) {
    return verb[~~context.plural * 3 + context.person - 1];
  }
  else {
    if (!context.plural && context.person === 3) {
      return verb ? verb[1] : infinitive + "s";
    }
    else {
      return verb ? verb[0] : infinitive;
    }
  }
}

const parseContext = module.exports.parseContext = function parseContext(context) {
  function contextShorthand(name, alias) {
    if (context[name]) {
      context[alias] = function(n) {
        return context[name][n];
      }
    }
  }

  contextShorthand("items", "item");
  contextShorthand("characters", "character");

  return context;
}

const parseTemplate = module.exports.parseTemplate = function parseTemplate(template, context, binder = "") {
  if (Array.isArray(template) && !template.every((s) => typeof s === "object")) {
    return template.map((sentence) => parseTemplate(sentence, context)).join(binder);
  }

  let statements;
  if (Array.isArray(template) && template.every((s) => typeof s === "object")) {
    statements = template.map((obj) => [obj.if, obj.write]);
  }
  else if (typeof template === "string") {
    let statementRegexp = /\[(.*?)\]([^\[]+)/g;
    statements = [];
    let statement = false;
    while (statement = statementRegexp.exec(template)) {
      statements.push(statement.slice(1, 3));
    }

    if (statements.length === 0) {
      statements = [["true", template]];
    }
  }

  const parser = new exprEval.Parser({
    operators: {logical: true, comparison: true}
  });

  let selectedTemplate = (statements.find(([test]) => parser.evaluate(test, context)) || [])[1];

  if (!selectedTemplate) {
    throw new Error("No statement matching context found");
  }

  return parsePhrase(selectedTemplate, context);
}

function parsePhrase(template, context) {
  let parts = template.split(/(?=\{)|(?<=\})/g).filter(Boolean);

  parts = parts.map((part) => {
    if (part.startsWith("{")) {
      return processPart(part.slice(1, -1), context);
    }
    return part;
  });

  return parts.join("");
}

const objectQueries = {
  "age": (object) => {
    if (settings.color) {
      return settings.color.blue(object.getAge());
    }
    else {
      return String(object.getAge());
    }
  },
  "name": (object, arg2, context = arg2) => {
    let correspondingObject = Object.entries(context).find(([key, value]) => value === object);
    if (correspondingObject && context.skipNames && context.skipNames.includes(correspondingObject[0])) {
      return object.getGender({pronoun: "personal"});
    }
    else {
      if (object && object.getName) {
        let name = object.getName(arg2 !== "true");

        if (settings.color) {
          if (object instanceof Character) {
            return settings.color.grey(name);
          }
          else {
            return settings.color.cyan(name);
          }
        }
        return name;
      }
      else if (object && object.name) {
        return object.name;
      }
      else {
        return "{name}";
      }
    }
  },
  "species": (object) => object.getSpecies(),
  "gender": (object, ctx) => {
    if (ctx.startsWith("pronoun:")) {
      return object.getGender({pronoun: ctx.slice(9)});
    }
    else if (ctx === "pronoun") {
      return object.getGender({pronoun: true});
    }
    else if (ctx === "adjective") {
      return object.getGender({adjective: true});
    }
    else if (ctx === "noun") {
      return object.getGender({noun: true});
    }
  },
  "pronoun:personal": (object) => object.getGender({pronoun: "personal"}),
  "pronoun:possessive": (object) => object.getGender({pronoun: "possessive"}),
  "pronoun:reflexive": (object) => object.getGender({pronoun: "reflexive"}),
  "color": (object, long) => {
    if (settings.color) {
      return settings.color.yellow(object.getSkinColor({}, long === "true"));
    }
    else {
      return object.getSkinColor({}, long === "true");
    }
  },
  "eye": (object) => {
    if (settings.color) {
      return settings.color.yellow(object.getEyeColor());
    }
    else {
      return object.getEyeColor();
    }
  }
};

function processPart(part, context) {
  const parser = new exprEval.Parser();
  let UC = false; // UperCase
  let result = part;
  if (part.startsWith("^")) {
    part = part.slice(1);
    UC = true;
  }
  let symbols = part.split(/\s*,\s*/g).map((symbol) => symbol.replace(/\\[\ss]/g, " "));

  if (symbols[0].startsWith("<") && symbols[0].endsWith(">")) {
    let object = parser.evaluate(symbols[1], context);
    let ctx;
    if (typeof object === "number") {
      ctx = {
        plural: number < 4,
        person: number % 3
      };
    }
    if (object instanceof Character) {
      ctx = {
        plural: object.gender === 2 && symbols[2] !== "false",
        person: 3
      }
    }

    result = conjugate(symbols[0].slice(1, -1), ctx);
  }

  if (symbols[0].startsWith("?")) {
    let res = parser.evaluate(symbols[0].slice(1), context);
    if (res) {
      result = symbols[1];
    }
    else {
      result = symbols[2];
    }
  }

  if (symbols[0].startsWith("!")) {
    let res = parser.evaluate(symbols[0].slice(1), context);
    if (res) result = res;
  }

  if (objectQueries[symbols[0]]) {
    let object = parser.evaluate(symbols[1], context);
    result = objectQueries[symbols[0]](object, ...symbols.slice(2), context);
  }

  if (UC) {
    result = uppercase(result);
  }

  return result;
}
