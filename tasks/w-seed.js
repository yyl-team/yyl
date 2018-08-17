// + seed
const seedGulpRequirejs = require('yyl-seed-gulp-requirejs');
const SEED = {};

[seedGulpRequirejs].forEach((seed) => {
  SEED[seed.name] = seed;
});

module.exports = SEED;
