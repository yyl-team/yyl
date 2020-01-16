const path = require('path');
const chai = require('chai');
const expect = chai.expect;
const util = require('yyl-util');
const tUtil = require('yyl-seed-test-util');
const request = require('yyl-request');

const yyl = require('../../index');
const vars = require('../../lib/vars');

const FRAG_PATH = path.join(__dirname, '../../__frag');
tUtil.frag.init(FRAG_PATH);

describe('server test', () => {
  it('yyl server --help', async () => {
    const h = await yyl.run('server --help --silent', __dirname);
    expect(h).not.equal(undefined);
  }).timeout(0);

  it('yyl server start', util.makeAsync(async () => {
    const setting = await yyl.run('server start --logLevel 0 --silent', __dirname);
    expect(setting.localserver).not.equal(false);
    const testPath = `http://${vars.LOCAL_SERVER}:${setting.localserver.port}/server.test.js`;
    const [, res] = await request(testPath);
    expect([testPath, res.statusCode]).to.deep.equal([testPath, 200]);
    await yyl.run('server abort');
  }, true));

  it(`yyl server start --path ${__dirname}`, util.makeAsync(async () => {
    const setting = await yyl.run(`server start --logLevel 0 --silent --path ${__dirname}`);
    expect(setting.localserver).not.equal(false);
    const testPath = `http://${vars.LOCAL_SERVER}:${setting.localserver.port}/server.test.js`;
    const [, res] = await request(testPath);
    expect(res.statusCode).equal(200);
    await yyl.run('server abort');
  }, true));

  it('yyl server start --path ./', util.makeAsync(async () => {
    const setting = await yyl.run('server start --logLevel 0 --silent --path ./', __dirname);
    expect(setting.localserver).not.equal(false);
    const testPath = `http://${vars.LOCAL_SERVER}:${setting.localserver.port}/server.test.js`;
    const [, res] = await request(testPath);
    expect(res.statusCode).equal(200);
    await yyl.run('server abort');
  }, true));

  it('yyl server -p', util.makeAsync(async () => {
    const iPath = await yyl.run('server -p --silent', __dirname);
    expect(iPath).to.equal(vars.SERVER_PATH);
  }, true));

  it('yyl server --path', util.makeAsync(async () => {
    const iPath = await yyl.run('server --path --silent', __dirname);
    expect(iPath).to.equal(vars.SERVER_PATH);
  }, true));
});
