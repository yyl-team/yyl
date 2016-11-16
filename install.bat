title yy workflow install
@echo off
cmd /c npm install
cmd /c npm link
cmd /c npm config set color always

echo ------------------------------
echo command yyl installed!
echo have fun!
cmd /k yyl

