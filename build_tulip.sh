#!/bin/bash
tape test/unit/*.js

echo "what is the build version?"
read VERSION
echo "building tulip $VERSION for OSX"
electron-packager . --appname=tulip --platform=darwin --arch=x64 --icon=tulip-logo.ico --app-version=$VERSION --overwrite
echo "building tulip $VERSION for Windows"
electron-packager . --appname=tulip --platform=win32 --arch=x64 --icon=tulip-logo.ico --app-version=$VERSION --overwrite

echo "tulip builds complete!"
# TODO automate distros as well
#  electron-installer-dmg ./tulip.app 'tulip' --background='../../background.png'
