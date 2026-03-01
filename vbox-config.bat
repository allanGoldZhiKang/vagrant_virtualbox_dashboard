@echo off
chcp 65001 >nul
node "%~dp0src\index.js" %*
