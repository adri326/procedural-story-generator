"use strict";

const randomName = require("random-name");
const {species, colors, traits} = require("./assets");
const grammar = require("./grammar");


const Character = module.exports = class Character {

  constructor() {
    // names
    this.firstName = Character.getRandomName("first");
    this.lastName = Character.getRandomName("last");

    // species
    if (settings.furry) {
      this.species = species[Math.floor(Math.random() * (species.length - 1)) + 1]; // Everything except human
    }
    else {
      this.species = species[0]; // Human
    }

    // skin (fur) tone
    {
      let list;
      if (settings.furry) {
        list = colors.fur;
      }
      else {
        list = colors.skin;
      }
      this.color = {
        main: list.main.random(),
        second: list.second.random(),
      };
    }

    // eye color
    if (settings.furry) {
      this.eyeColor = colors.eye.all.concat(colors.eye.feral).random();
    }
    else {
      this.eyeColor = colors.eye.all.random();
    }

    // age
    this.age = Math.round(Math.random() * (settings.ageRange[1] - settings.ageRange[0]) + settings.ageRange[0]);

    // gender
    this.gender = Math.min(Math.floor(Math.random() * (2 + settings.nonBinaryRate)), 2);

    // special traits
    this.traits = [];
    let traitsAmount = Math.round(Math.random() * (settings.traitsAmount[1] - settings.traitsAmount[0]) + settings.traitsAmount[0]);
    for (let n = 0; n < traitsAmount; n++) {
      let trait = this.getRandomTrait();
      if (trait) this.traits.push(trait);
    }

    // owned
    this.ownings = [];
  }

  getName(short = false) {
    if (short) {
      return this.firstName;
    }
    else {
      return this.firstName + " " + this.lastName;
    }
  }

  getSpecies(context = {}) {
    let word = context.plural ? this.species[1] : this.species[0];
    if (context.uppercase) {
      word = grammar.uppercase(word);
    }
    return word;
  }

  getSkinColor(context = {}, short = false) {
    let main = this.color.main;
    let second = this.color.second;
    if (context.uppercase) {
      if (short) {
        main = grammar.uppercase(main);
      }
      else {
        second = grammar.uppercase(second);
      }
    }
    if (short) {
      return main;
    }
    else {
      return second + " " + main;
    }
  }

  getAge(short = true) {
    if (short) {
      return this.age;
    }
    else {
      return `${this.age} years old`;
    }
  }

  getGender(context = {}) {
    if (context.pronoun) {
      let word;
      switch (context.pronoun) {
        case "personal":
          word = grammar.pronouns[this.gender][0];
          break;

        case "reflexive":
          word = grammar.pronouns[this.gender][1] + "self";
          break;

        case "possessive":
          word = grammar.pronouns[this.gender][2];
          break;

        default:
          word = grammar.pronouns[this.gender][1];
      }
      if (context.uppercase) {
        word = grammar.uppercase(word);
      }
      return word;
    }
    else if (context.noun) {
      let word;
      if (this.gender === 0) {
        word = "boy";
      }
      if (this.gender === 1) {
        word = "girl";
      }
      if (this.gender === 2) {
        throw new Error("No noun for neutral gendered persons");
      }
      if (context.uppercase) {
        word = grammar.uppercase(word);
      }
      return word;
    }
    else if (context.adjective) {
      let word;
      if (this.gender === 0) {
        word = "male";
      }
      else if (this.gender === 1) {
        word = "female";
      }
      else {
        return "";
      }
      if (context.uppercase) {
        word = grammar.uppercase(word);
      }
      return word;
    }
  }

  getEyeColor() {
    return this.eyeColor;
  }

  getLongDescription() {
    const context = {
      settings,
      "this": this
    };

    let descriptor = [
      "[settings.furry and this.gender != 2]{name, this} {<be>, this} a {age, this} years old {gender, this, adjective} {species, this}."
      + "[settings.furry]{name, this} {<be>, this} a {age, this} years old {species, this}."
      + "[this.gender != 2]{name, this} {<be>, this} a {age, this} years old {gender, this, noun}."
      + "[true]{name, this} {<be>, this} {age, this} years old.",

      "[true] {^pronoun:personal, this} {<have>, this} a {color, this} {? settings.furry, fur, skin}"
      + " and {eye, this} eyes."
    ];

    let base = grammar.parseTemplate(descriptor, context);

    let details = grammar.parseTemplate(
      this.traits.map((trait) => traits.find((t) => t.name === trait).description),
      {skipNames: ["this"], ...context},
      " "
    );

    return base + (details ? "\n" + details : "");
  }

  owns(object) {
    return this.ownings.includes(object.name || object);
  }

  lose(object) {
    let index = this.ownings.indexOf(object.name || object);
    if (~index) {
      this.ownings.splice(index, 1);
    }
  }

  receive(object) {
    this.ownings.push(object.name || object);
  }


  static getRandomName(kind) {
    if (kind === "first") {
      return randomName.first();
    }
    else if (kind === "middle") {
      return randomName.middle();
    }
    else if (kind === "last") {
      return randomName.last();
    }
    else {
      return randomName();
    }
  }

  getRandomTrait() {
    // get rid of any clashing/dupe trait
    let availableTraits = traits.filter((trait) =>
      !(trait.clashes || [])
      .some((t) => this.traits.includes(t))
      && !this.traits.includes(trait.name)
    );
    if (availableTraits.length) {
      let probabilitySum = availableTraits.reduce((acc, act) => acc + (typeof act.prob === "undefined" ? 1 : act.prob), 0);
      let number = Math.random() * probabilitySum;
      let current = 0;
      for (let accumulator = 0; accumulator < number && current < availableTraits.length; current++) {
        accumulator += typeof availableTraits[current].prob === "undefined" ? 1 : availableTraits[current].prob;
      }
      current--; // for loops bumps before testing
      //console.log(availableTraits[current].name);
      return availableTraits[current].name;
    }
  }
}
