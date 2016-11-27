'use strict';

var util = require('../lib/yyl-util.js');

var 
    wTest = function(){
        util.runSpawn('git pull', function(err){
            if(err){
                console.log(err)
            }

        });

    };

module.exports = wTest;
