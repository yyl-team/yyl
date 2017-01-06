title yy workflow uninstall
@echo off

cmd /c npm unlink

@rem 删除当前目录的 node_module, etc, yyl, yyl.cmd, mime, mime.cmd
set YYL_BASE_NODE_MODULE_PATH=%cd%\node_modules

if exist %YYL_BASE_NODE_MODULE_PATH% (
    echo removing yyl base path: 
    echo %YYL_BASE_NODE_MODULE_PATH%
    rd /s /q %YYL_BASE_NODE_MODULE_PATH%
    echo done
)

@rem 删除 yyl server 目录下所有文件
set YYL_SERVER_PATH=%USERPROFILE%\.yyl
if exist %YYL_SERVER_PATH% (
    echo removing yyl server path:
    echo %YYL_SERVER_PATH%
    rd /s /q %YYL_SERVER_PATH%
    echo done
)

@rem 删除 yyl 句柄
set YYL_CMD_FILE01=%APPDATA%\npm\yyl.cmd
set YYL_CMD_FILE02=%APPDATA%\npm\yyl

if exist %YYL_CMD_FILE01% (
    echo removing %YYL_CMD_FILE01%
    DEL %YYL_CMD_FILE01%
    echo done
)

if exist %YYL_CMD_FILE02% (
    echo removing %YYL_CMD_FILE02%
    DEL %YYL_CMD_FILE02%
    echo done
)


echo -------------------
echo yyl uninstall done!
pause


