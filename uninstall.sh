#!/bin/sh
echo
echo yylive workflow uninstall

nowUserId=`id -u`
rootId="0"

filepath=$(cd "$(dirname "$0")"; pwd)
cd $filepath

# remove base node_modules
npm uninstall

# remove yyl server path
serverPath="~/.yyl"
if [ ! -x "$serverPath"];then
    rm -rf "$serverPath"
fi

# remove yyl command
if [ "$nowUserId" != "$rootId" ];then
    echo this param neet to run with root
    sudo npm unlink
else
    npm unlink
fi

echo -------------------
echo yyl uninstall done!
