#!/bin/sh
echo
echo yylive workflow init
echo
echo start check base command exist

if [ `command -v node` ]; then
    echo command pass - node 
else
    echo command not fond, please check - node
    exit
fi

# +check command
if [ `command -v npm` ]; then
    echo command pass - npm

else
    echo command not fond, please check - npm
    exit
fi


if [ `command -v ruby` ]; then
    echo command pass - ruby

else
    echo command not fond, please check - ruby
    exit
fi


if [ `command -v git` ]; then
    echo command pass - git

else
    echo command not fond, please check - git
    exit
fi

if [ `command -v svn` ]; then
    echo command pass - svn

else
    echo command not fond, please check - svn
    exit
fi

echo ------------------------------
echo ok, let start init!
# -check command

nowUserId=`id -u`
rootId="0"

filepath=$(cd "$(dirname "$0")"; pwd)
cd $filepath

npm install

if [ "$nowUserId" != "$rootId" ];then
    echo this param neet to run with root
    sudo npm link
else
    npm link
fi

echo ------------------------------
echo "command \033[44;37;5m yyl \033[0m installed!"
echo have fun!
echo 

yyl
