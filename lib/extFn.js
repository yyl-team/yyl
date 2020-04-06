const extFn = {
  hideProtocol: function (str) {
    if (typeof str === 'string') {
      return str.replace(/^http[s]?:/, '')
    } else {
      return str
    }
  },
}
module.exports = extFn
