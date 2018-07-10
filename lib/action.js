"use strict";
const exprEval = require("expr-eval");
const parser = new exprEval.Parser();
const grammar = require("./grammar");

const Action = module.exports = class Action {
  constructor(parent) {
    this.name = parent.name;
    this.description = parent.description;
    this.requires = parent.requires || [];
    this.apply = parent.apply || [];
  }

  isValid(context) {
    return this.requires.every((req) => Action.testRequirement(req, context));
  }

  applyAction(context) {
    this.apply.forEach((statement) => Action.applyAction(statement, context));
  }

  print(context) {
    return grammar.parseTemplate(this.description, context);
  }

  static testRequirement(req, context) {
    let parts = req.split(":");
    if (parts.length === 1) {
      return parser.evaluate(parts[0], context);
    }
    else if (parts.length === 2) {
      let a = parser.evaluate(parts[0], context);
      let b = parser.evaluate(parts[1], context);
      if (typeof a === "function") {
        a(b);
      }
      else if (typeof a === "object") {
        if (Array.isArray(a) && typeof b === "number") {
          return a.length >= b;
        }
      }
    }
    else if (parts.length === 3) {
      let a = parser.evaluate(parts[0], context);
      if (typeof a === "object") {
        let b = a[parts[1].trim()].bind(a);
        return b(parser.evaluate(parts[2], context));
      }
    }
  }

  static applyAction(statement, context) {
    let parts = statement.split(":");
    if (parts.length === 3) {
      let a = parser.evaluate(parts[0], context);
      if (typeof a === "object") {
        let b = a[parts[1].trim()];
        if (typeof b === "function") {
          b = b.bind(a);
          return b(parser.evaluate(parts[2], context));
        }
        else if (typeof b === "number") {
          if (parts[2].trim().startsWith("+")) {
            a[parts[1].trim()] = b + (+parts[2].trim());
          }
          else if (parts[2].trim().startsWith("+")) {
            a[parts[1].trim()] = b - (+parts[2].trim());
          }
          else {
            a[parts[1].trim()] = +parts[2].trim();
          }
        }
      }
    }
  }
}
