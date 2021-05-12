const seed = {
  packages: ['yyl-seed-webpack', 'yyl-seed-requirejs', 'yyl-seed-other'],
  install(seeds) {
    console.log(seeds)
    // TODO:
  },
  get(seedName) {
    console.log(seedName)
    // TODO:
  }
}

module.exports = seed
