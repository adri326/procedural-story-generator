"use strict";

const grammar = require("./lib/grammar");
const assets = require("./lib/assets");
const Character = require("./lib/character");
const Item = require("./lib/item");
const Action = require("./lib/action");
const Situation = require("./lib/situation");

Array.prototype.random = function() {
	return this[Math.floor(Math.random() * this.length)];
}

global.settings = {
	furry: false,
	ageRange: [15, 35],
	traitsAmount: [1, 5],
	nonBinaryRate: 0.5
};

try {
	global.settings.color = require("colors/safe");
} catch (e) {}


/* Procedural story generator

The different elements are:
- characters
	- their emotions
	- their preferences
	- their connections to each other
	- clothing
	- possessions
- items
- actions
	- one or several characters or items do something
	- the action may do something to one or more characters or items
- situations
	- describe a set of actions, linked together
	- describe which situation could come next

*/
console.log();

var char = [];

for (let x = 0; x < 2; x++) {
	char[x] = new Character();
	console.log(char[x].getLongDescription());
	console.log();
}

let ctx = grammar.parseContext({
	characters: char,
	items: [assets.items[0]]
});

char[0].ownings.push("watch");
//char[1].ownings.push("pen");


let situation = assets.situations.filter((situation) => situation.starter).random();

let situationCtx = situation.init(ctx);
if (situationCtx) {
  situation.run(situationCtx).then(console.log).catch(console.error);
}

//console.log(grammar.parseTemplate(assets.actions[0].description, ctx));
