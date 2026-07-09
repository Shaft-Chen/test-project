# 学习通刷课脚本

基于 Playwright 的超星学习通自动刷课工具，支持自动播放视频、自动答题等功能。

## 📁 项目结构

```
test-project/
├── start.py          # Playwright 启动脚本
├── script.js         # 核心刷课逻辑（JavaScript）
└── run.bat           # 一键启动批处理文件
```

## ✨ 功能特性

- 🎬 **自动播放视频** - 自动检测并播放课程视频
- 📝 **自动答题** - 此功能存在缺陷.暂时停用
- ⚡ **一键启动** - 通过 bat 文件快速启动，无需手动配置环境
- 🔄 **断点续播** - 记录观看进度，支持继续上次位置
- 🛡️ **智能防检测** - 模拟真实用户行为，降低被检测风险

## 🚀 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- Playwright 浏览器驱动

### 安装步骤

1. 克隆仓库到本地：
```bash
git clone https://github.com/Shaft-Chen/test-project.git
cd test-project
```

2. 安装 Python 依赖：
```bash
pip install playwright
playwright install
```

3. 安装 Node.js 依赖（如果需要）：
```bash
npm install
```

### 使用方法

**方式一：一键启动（推荐）**
```bash
# Windows 用户直接双击运行
run.bat
```

**方式二：命令行启动**
```bash
# 启动 Playwright 并运行脚本
python start.py
```

## ⚙️ 配置说明

在使用前，请确保：

1. 已安装 Chrome 或 Chromium 浏览器
2. 首次使用需要登录学习通账号
3. 根据实际情况修改 `script.js` 中的配置参数

## 📋 使用流程

1. 运行 `run.bat` 或 `python start.py`
2. 浏览器会自动打开并进入学习通页面
3. 登录你的账号（首次需要手动登录）
4. 选择要刷的课程
5. 脚本将自动完成视频播放和答题任务

## 🔧 常见问题

### Q: 首次运行报错？
A: 请确认已正确安装 Playwright 和浏览器驱动。

### Q: 脚本无法自动登录？
A: 首次使用需要手动登录一次，后续会保存登录状态。

### Q: 视频播放卡顿？
A: 可能是网络问题，建议在网络良好的环境下使用。

## ⚠️ 免责声明

本项目仅供学习和研究使用，请勿用于商业用途或违反学校规定的行为。使用者需自行承担相关责任。

## 📄 许可证

MIT License
