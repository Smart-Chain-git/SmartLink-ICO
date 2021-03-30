const config = require('../../config/config.js');

module.exports = {
  "prim": "Pair",
  "args": [
    {
      "prim": "Pair",
      "args": [
        { "string": config.ADDRESS },
        [ { "prim": "Elt", "args": [ { "string": config.ADDRESS }, { "prim": "Pair", "args": [ [], { "int": config.SUPPLY } ] } ] } ]
      ]
    },
    { "prim": "Pair", "args": [ { "string": config.ADDRESS }, { "prim": "Pair", "args": [ [], { "int": config.SUPPLY } ] } ] }
  ]
}