const chai = require('chai');
const expect = chai.expect;
const yyl = require('../../index');
const util = require('yyl-util');

describe('help test', () => {
  it('yyl -h', util.makeAsync(async () => {
    const h = await yyl.run('yyl -h --silent');
    expect(h).not.equal(undefined);
  }, true));
  it('yyl --help', util.makeAsync(async () => {
    const h = await yyl.run('yyl --help --silent');
    expect(h).not.equal(undefined);
  }, true));
});