'use strict';
var 
    color = require('../lib/colors'),
    util = require('../lib/yyl-util'),
    path = require('path'),
    fs = require('fs'),
    inquirer = require('inquirer');


var 
    wInit = function(){
        // 信息收集
        new util.Promise(function(next){
            var 
                prompt = inquirer.createPromptModule();

            prompt([
                {
                    name: 'name',
                    message: 'name',
                    type: 'input',
                    default: path.dirname(process.cwd()).split(/[\/\\]/).pop(),
                }, {
                    name: 'version',
                    message: 'version',
                    type: 'input',
                    default: '0.1.0'
                }, {
                    name: 'platforms',
                    message: 'platform',
                    type: 'checkbox',
                    choices: ['pc', 'mobile'],
                    default: ['pc']
                }

            ], next);

        }).then(function(data, next){
            var 
                prompt = inquirer.createPromptModule(),
                questions = [],
                workflows = fs.readdirSync(path.join(__dirname, '../init-files'));

            if(~data.platforms.indexOf('pc')){
                questions.push({
                    name: 'pcWorkflow',
                    message: 'pc workflow',
                    type: 'list',
                    choices: workflows,
                    default: 'gulp-requirejs'
                });
            }
            if(~data.platforms.indexOf('mobile')){
                questions.push({
                    name: 'mobileWorkflow',
                    message: 'mobile workflow',
                    type: 'list',
                    choices: workflows,
                    default: 'webpack-vue'
                });

            }
            prompt(questions, function(d){
                next(util.extend(data, d));
            });
        }).then(function(data, next){
            console.log([
                '',
                '-------------------',
                ' project ' + color.yellow(data.name) + ' path initial like this:',
                ''
            ].join('\n'));
            var printArr = [' '+ data.name];

            if(~data.platforms.indexOf('pc')){
                printArr = printArr.concat([
                    ' |~ pc',
                    ' |  |- dist',
                    ' |  `~ src',
                    ' |     |+ components',
                    ' |     |+ js',
                    ' |     |+ css',
                    ' |     |+ sass',
                    ' |     |+ images',
                    ' |     `+ html',

                ]);
            }
            if(~data.platforms.indexOf('mobile')){
                printArr = printArr.concat([
                    ' |~ mobile',
                    ' |  |- dist',
                    ' |  `~ src',
                    ' |     |+ components',
                    ' |     |+ js',
                    ' |     |+ css',
                    ' |     |+ sass',
                    ' |     |+ images',
                    ' |     `+ html'

                ]);
            }
            printArr = printArr.concat([
                    ' `~ ...'
            ]);

            console.log(printArr.join('\n'));

            var 
                prompt = inquirer.createPromptModule();

            prompt( [
                {
                    name: 'ok',
                    message: 'is it ok?',
                    type: 'confirm'
                }
            ], function(d){
                if(d.ok){
                    next(data);
                }
            });
        }).then(function(data, next){

        }).start();

    };

module.exports = wInit;
