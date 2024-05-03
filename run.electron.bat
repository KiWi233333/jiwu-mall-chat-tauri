@echo off
wait-on http://localhost:3000 && electron ./.output/electron/background.js