@echo off
:: 设置控制台编码为 UTF-8 防止中文乱码
chcp 65001 >nul
title 学习通全自动防风控挂机助手

echo =========================================
echo       学习通挂机助手 - 初始化检测
echo =========================================

:: 检测是否安装了 Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [错误] 未检测到 Node.js 环境！
    echo 请先去官网 (https://nodejs.org/) 下载并安装 Node.js。
    echo 安装时一路狂点“下一步”即可，安装完请重新打开本程序。
    echo.
    pause
    exit
)

:: 检测依赖是否安装，如果没有则自动静默安装
if not exist node_modules (
    echo.
    echo [首次运行] 正在自动配置防检测底层环境，请耐心等待1-3分钟...
    echo 下载过程中请不要关闭本窗口！
    echo.
    call npm init -y >nul 2>&1
    call npm install playwright playwright-extra puppeteer-extra-plugin-stealth >nul 2>&1
    echo.
    echo 环境配置成功！
)

echo.
echo 环境正常，正在呼叫 Edge 浏览器...
echo.

:: 启动你的 Node 脚本
node run.js

echo.
pause