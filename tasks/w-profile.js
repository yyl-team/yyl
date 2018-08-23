const util = require('./w-util.js');
const extFs = require('yyl-fs');
const fs = require('fs');
const path = require('path');

const PROFILE_PATH = path.join(util.vars.SERVER_DATA_PATH, 'profile.js');

const wProfile = function (key, val) {
  const she = wProfile;
  if (!she.data) {
    she.init();
  }
  if (!arguments.length) {
    return she.data;
  }

  if (val !== undefined) { //set
    she.data[key] = val;
    she.save();
    return val;
  } else { // get
    return she.data[key];
  }
};

wProfile.init = function() {
  const she = wProfile;
  she.data = {};
  if (fs.existsSync(PROFILE_PATH)) {
    try {
      she.data = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
    } catch (er) {}
  } else {
    extFs.mkdirSync(path.dirname(PROFILE_PATH));
    fs.writeFileSync(PROFILE_PATH, '{}');
  }
};

wProfile.save = function() {
  const she = wProfile;
  if (!she.data) {
    return;
  }
  extFs.mkdirSync(path.dirname(PROFILE_PATH));
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(she.data, null, 2));
};

wProfile.clear = function() {
  const she = wProfile;
  she.data = {};
  she.save();
};

module.exports = wProfile;
