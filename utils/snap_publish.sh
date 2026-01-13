#!/bin/bash
rm -rf dist
npm ci
npm run convert-svg
npx electron-builder --linux snap
snapcraft upload $(ls dist/*.snap|tail -1)
