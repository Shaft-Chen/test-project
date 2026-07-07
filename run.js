const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const scriptPath = path.resolve(__dirname, 'script.user.js');
  const userDataDir = path.resolve(__dirname, 'chaoxing-user-data');

  console.log('🚀 正在启动浏览器 (无痕全局注入模式)...');

  let context;
  const launchOptions = {
    headless: false,
    viewport: null,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  };

  try {
    // 第一选择：尝试召唤 Edge 浏览器
    console.log('🔄 正在尝试唤醒 Microsoft Edge...');
    launchOptions.channel = 'msedge';
    context = await chromium.launchPersistentContext(userDataDir, launchOptions);
  } catch (error) {
    console.log('⚠️ 未检测到 Edge 浏览器，正在尝试唤醒 Google Chrome...');
    try {
      // 备用选择：尝试召唤 Chrome 浏览器
      launchOptions.channel = 'chrome';
      context = await chromium.launchPersistentContext(userDataDir, launchOptions);
    } catch (err) {
      console.error('\n❌ 致命错误：你的电脑上必须安装 Microsoft Edge 或 Google Chrome 浏览器才能运行此工具！');
      console.error('👉 请先安装任意一款浏览器后再试。');
      process.exit(1); // 优雅退出，防止黑窗口无限卡死
    }
  }

  // 1. 抹除自动化特征
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.navigator.chrome = { runtime: {} };
  });

  // 2. 读取本地的 V7 脚本代码
  const rawScript = fs.readFileSync(scriptPath, 'utf8');

  // 🌟 3. 核心修复：把代码包装一下，使用 Context 全局注入！
  // 这样无论学习通弹出多少个新标签页，代码都会像幽灵一样自动跟过去。
  const injectedCode = "window.addEventListener('load', () => {\n" +
    "  // 只在顶层页面执行（排除干扰），且网址必须包含 studentstudy 播放页\n" +
    "  if (window === window.top && window.location.href.includes('studentstudy')) {\n" +
    "    console.log('%c💉 Playwright 跨标签页全局注入成功！', 'color:#E91E63;font-size:18px;font-weight:bold');\n" +
    "    try {\n" +
    "      " + rawScript + "\n" +
    "    } catch(e) {\n" +
    "      console.error('脚本运行报错:', e);\n" +
    "    }\n" +
    "  }\n" +
    "});";

  // 将组装好的代码注入到浏览器的整个上下文中（对所有新老标签页全部生效！）
  await context.addInitScript({ content: injectedCode });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // 4. 打开学习通主页
  console.log('🌐 正在打开学习通主页...');
  await page.goto('https://passport2.chaoxing.com/login?loginType=1&newversion=true');

  console.log('\n🎉 系统已就绪！');
  console.log('👉 请登录并点开任意视频章节（即使它弹出新标签页也没关系）。');
  console.log('👉 若遇到【验证码/机器人检测】，请手动点击或刷新一次页面即可继续！');
  console.log('👉 按 F12 打开控制台，你会看到刺眼的红色提示：💉 Playwright 跨标签页全局注入成功！');
})();