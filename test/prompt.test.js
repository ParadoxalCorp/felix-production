/* eslint-disable no-undef */

const prompt = require('../utils/prompt');
const stdin = require("mock-stdin").stdin();

describe('prompt()', function () {
 it('should ask user a question and await a for response', function () {
  prompt("what is 2 times 2: ");
  stdin.send("4");
  stdin.end();
  stdin.reset();
  console.assert("what is 2 times 2: 4");
 });
});
