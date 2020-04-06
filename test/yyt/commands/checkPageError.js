exports.command = function (address, filter) {
  const client = this
  return client
    .deleteCookies()
    .verify.ok(address, 'checking start')
    .url(address)
    .getLog('browser', function (logs) {
      let errors = []
      logs.forEach((log) => {
        if (log.level === 'SEVERE') {
          errors.push(log.message)
        }
      })

      if (typeof filter === 'function') {
        errors = errors.filter(filter)
      }
      this.verify.ok(errors.length === 0, `${address} run PASS`)
    })
}
