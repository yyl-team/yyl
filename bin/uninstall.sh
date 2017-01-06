#!/bin/sh
echo
echo yylive workflow uninstall

nowUserId=`id -u`
rootId="0"

# 获取 当前目录的父级($0), 然后 执行 cd .. 然后 执行 pwd 将结果返回给 filepath
filepath=$(cd "$(dirname "$0")"; cd ..; pwd)
cd $filepath

# remove base node_modules
npm uninstall

# remove yyl server path
serverPath="~/.yyl"
if [ ! -x "$serverPath" ];then
    echo removing yyl server path:
    echo $serverPath
    rm -rf ~/.yyl
    echo done
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
echo 
