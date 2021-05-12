async function optimize({ context, logger, env }) {
  console.log(context, logger, env)
  // TODO:
}

optimize.help = ({ env }) => {
  console.log(env)
  // TODO:
}

module.exports = optimize
