const chai = require('chai');
const expect = chai.expect;
const util = require('yyl-util');
const path = require('path');
const http = require('http');

const yyl = require('../../index');

describe('mock test', () => {
  const mockPath = path.join(__dirname, '../case/gulp-requirejs');
  const get = function (iPath, isJson) {
    const runner = function(next) {
      http.get(iPath, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let data = rawData;
          if (isJson) {
            data = JSON.parse(rawData);
          }
          next([res, data]);
        });
      });
    };
    return new Promise(runner);
  };

  before('mock server start', util.makeAsync(async () => {
    await yyl.run('server start --silent --logLevel 0', mockPath);
  }, true));

  it('/db', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/db';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(typeof data).equal('object');
  }, true));

  it('/mockapi', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).not.equal(0);
  }, true));

  it('/mockapi/1', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi/1';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(typeof data).equal('object');
  }, true));

  it('/mockapi?_sort=id', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_sort=id';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data[0].id).equal(1);
  }, true));

  it('/mockapi?_sort=id&_order=desc', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_sort=id&_order=desc';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data[0].id).equal(5);
  }, true));

  it('/mockapi?_start=1', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_start=1';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(4);
  }, true));

  it('/mockapi?_end=3', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_end=3';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(4);
  }, true));

  it('/mockapi?_limit=3', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_limit=3';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(3);
  }, true));

  it('/mockapi?_limit=-1', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_limit=-1';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(0);
  }, true));

  it('/mockapi?_start=1&_end=3', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_start=1&_end=3';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(3);
  }, true));

  it('/mockapi?_start=1&_end=3&_limit=2', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?_start=1&_end=3&_limit=2';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(2);
  }, true));

  it('/mockapi?id_gte=2', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?id_gte=2';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(4);
  }, true));

  it('/mockapi?id_lte=2', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?id_lte=2';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(2);
  }, true));

  it('/mockapi?id_ne=2', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?id_ne=2';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(4);
  }, true));

  it('/mockapi?title_like=又', util.makeAsync(async () => {
    const testPath = `http://127.0.0.1:5000/mockapi?title_like=${encodeURIComponent('又')}`;
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(1);
  }, true));

  it('/mockapi?uid=1369446333', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mockapi?uid=1369446333';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).equal(1);
  }, true));


  it('/justObject', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/justObject';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(typeof data).equal('object');
  }, true));

  it('routes test /api/1', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/api/1';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(typeof data).equal('object');
  }, true));

  it('routes test /api', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/api';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(data.length).not.equal(0);
  }, true));

  it('routes test /mapi/1', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mapi/1';
    const argv = await get(testPath, true);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    expect(typeof data).equal('object');
  }, true));


  const jsonpMatch = /^aa\((.+)\);$/;
  it('jsonp test /mapi/1?callback=aa', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mapi/1?callback=aa';
    const argv = await get(testPath);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    const iMatch = data.match(jsonpMatch);
    expect(iMatch).not.equal(null);
    expect(typeof JSON.parse(iMatch[1])).equal('object');
  }, true));

  it('jsonp test /mapi?jsonp=bb&bb=aa', util.makeAsync(async () => {
    const testPath = 'http://127.0.0.1:5000/mapi?jsonp=bb&bb=aa';
    const argv = await get(testPath);
    const [res, data] = argv;
    expect(res.statusCode).equal(200);
    const iMatch = data.match(jsonpMatch);
    expect(iMatch).not.equal(null);
    expect(typeof JSON.parse(iMatch[1])).equal('object');
  }, true));

  after('mock server abort', util.makeAsync(async () => {
    await yyl.run('server abort');
  }, true));
});