"use strict"; // doesn't really matter 'cause we're playing with classes, but heh

const Item = module.exports = class Item {
  constructor(parent) {
    this.name = parent.name;
  }

  getName() {
    return this.name;
  }
}
