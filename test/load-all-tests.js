require("mocha/mocha.js");
require("mocha/mocha.css");
mocha.setup("bdd");

let context = require.context("./", true, /\.ts$/);

context.keys().forEach(file => {
  context(file);
});

let mochaDiv = document.createElement("div");
mochaDiv.id = "mocha";
document.body.appendChild(mochaDiv);

mocha.run();
