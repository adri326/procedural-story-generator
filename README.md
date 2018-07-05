# procedural-story-generator

Generates stories which often makes little or no sense. **WIP**

## Installation and running the thing

Clone this repository and run the project using `node`. As the project is in development, there is no real stuff behind it, running it will only display you a test story, with `A` giving their watch or pen to `B` and `B` gifting them with their watch or pen.

```sh
git clone https://github.com/adri326/procedural-story-generator.git
cd procedural-story-generator
npm i
node ./
```

## Formatting: assets

All assets can be found in `/assets`. You may add your own assets by creating a directory next to `main` and putting `.json` files in it.

### colors.json

```json
{
  "skin": {
    "main": [
      "chocolate",
      "sand",
      "..."
    ],
    "second": [
      "dark",
      "warm",
      "..."
    ]
  },
  "fur": {
    "main": [],
    "second": []
  },
  "eye": {
    "all": [
      "blue",
      "green",
      "..."
    ],
    "feral": [
      "yellow",
      "..."
    ]
  }
}
```

### items.json

Contains an `Array` of `Item`s, these following this syntax:

```json
{
  "name": "Object_name",
  "description": "A description of the object."
}
```

### species.json

Only used when `settings.furry = true`, otherwise uses the "Human" species.

```json
[
  ["human", "humans"]
  ["singular", "plural"]
]
```

### traits.json

Defines traits for the characters, it is an `Array` of `Trait`s, defined as follows:

```json
{
  "name": "amnesiac",
  "description": "Description template (this = current character)",
  "rarity": 0.8,
  "clashes": [
    "hypermnesiac"
  ]
}
```

`rarity` and `clashes` are optional.

### actions.json

This json contains an `Array` of `Action`s. An `Action` has the following syntax:

```json
{
  "name": "action_name",
  "description": "Description template",
  "requires": [
    "Requirements (explained below)"
  ],
  "apply": [
    "Context modifications (explained below)"
  ]
}
```

`requires` and `apply` are optional.

**Requirements** can be one of:
* `expression` - requirement will fulfill if expression returns a truthy value
* `selector: argument` - `selector` and `argument` will first be treated as expression. Then:
  * if `selector` resolves to an `Array` and `argument` to a number, the requirement will only fulfill if `selector.length >= argument`
  * if `selector` resolves to a function: runs this function with as argument `argument`
* `selector:subselector: argument` - `selector` will be treated as an expression. Then:
  * if `selector[subselector]` is a function, execute this function with as argument `argument` and fulfill if its result is truthy. *Use this way of running methods on Objects, Characters and Items, because of [**this issue**](https://github.com/silentmatt/expr-eval/issues/169).*

An action can only be ran if all requirements (if there are any) fulfills.

Example:

```json
{
  "name": "hit",
  "require": [
    "characters: 2"
  ],
  "description": "{^name, character(0)} hits {name, character(1)}."
}
```

This action will only work if there are two or more characters, hence the `characters: 2`.

**Context modifications** follows the same syntax as the **Requirements**. They allow you to do modifications to the characters, such as giving them items.

### situations.json

(the most complicated ones)

An `Array` of `Situation`s. Syntax being:

```json
{
  "name": "situation_name",
  "characters": [],
  "items": [
    "item selector"
  ],
  "variations": [
    {"name": "variation_name", "test": "test expression"}
  ],
  "actions": []
}
```

`variations` is optional.

`characters` is an `Array` of "Character descriptors". These character descriptors are `Array`s of conditions, **character requirements**, that a character has to fulfill to be added to the characters list. If no character is found, the `Situation` will be rejected.

**Character requirements** follow the same syntax as the **Requirements** (see above).

`actions` is an `Array` of "Action descriptors". These "Action descriptors" have the following syntax:

```json
{
  "name": "action_name",
  "if": "expression",
  "characters": [0, 2, 1],
  "items": [4, 1],
  "others": {
    "other": "properties"
  }
}
```

`items`, `characters`, `if` and `others` are optional.

If `if` is provided, the action will only be triggered if the expression fulfills.

`characters` and `items` represent mapping of the `characters` and `items` of the `Situation` to the action's context, they contain the IDs of the `characters` and `items` needed. If they are omitted, no `item`/`character` will be given to the action.
