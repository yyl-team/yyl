'use strict';
const path = require('path');
const fs = require('fs');

const util = require('./w-util.js');
const vars = util.vars;
const log = require('./w-log.js');

var
  remove = function(iPath) {
    const runner = (done) => {
      log('start', 'remove');
      var tPath = '';
      if (path.isAbsolute(iPath)) {
        tPath = iPath;
      } else {
        tPath = util.joinFormat(vars.PROJECT_PATH, iPath);
      }

      var iBaseName = path.basename(tPath);

      if (!fs.existsSync(tPath)) {
        log('msg', 'error', `${tPath} is not exists`);
        log('finish');
        throw new Error(`${tPath} is not exists`);
      }

      if (iBaseName == 'node_modules') {
        var iPromise = new util.Promise();
        var dirList = fs.readdirSync(tPath);

        dirList.forEach((pathname) => {
          var filePath = path.join(tPath, pathname);

          if (/ /.test(pathname)) {
            return log('msg', 'warn', `filename with space, cannot remove: ${pathname}`);
          }

          if (!fs.statSync(filePath).isDirectory()) {
            return;
          }

          if (/\.bin/.test(pathname)) {
            return;
          }

          iPromise.then((next) => {
            log('msg', 'info', `clearing path: ${tPath}`);
            util.removeFiles(tPath, (err) => {
              if (err) {
                log('msg', 'warn', ['remove files error', err]);

                var iCmd = `npm uninstall ${pathname}`;
                log('msg', 'info', `run cmd ${iCmd}`);

                util.runCMD( iCmd, (err) => {
                  if (err) {
                    log('msg', 'warn' [`${iCmd} run error:`, err]);
                  }
                  next();
                });
              } else {
                log('msg', 'success', `clear finished: ${tPath}`);
                next();
              }
            });
          });
        });
        iPromise.then(() => {
          util.removeFiles(tPath, (err) => {
            if (err) {
              log('msg', 'warn', ['remove files error', err, tPath]);
              log('finish');
              throw new Error(err);
            } else {
              log('msg', 'success', `remove file finished: ${tPath}`);
            }
            log('finish');
            done(err);
          });
        });

        iPromise.start();
      } else {
        util.removeFiles(tPath, (err) => {
          if (err) {
            log('msg', 'warn', ['remove files error:', err, tPath]);
            log('finish');
            throw new Error(err);
          } else {
            log('msg', 'success', `remove file finished: ${tPath}`);
          }

          log('finish');
          done(null);
        });
      }
    };
    return new Promise((next) => {
      runner(next);
    });
  };


module.exports = remove;
