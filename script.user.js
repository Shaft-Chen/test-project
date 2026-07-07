// ==UserScript==
// @name         学习通自动刷课脚本 V7 完美养老版
// @namespace    local.codex.xuexitong
// @version      7.0.0
// @description  彻底拦截mouseout防暂停，智能等待iframe加载免刷新，终极无脑挂机
// @author       Codex
// @match        *://mooc1.chaoxing.com/mycourse/studentstudy*
// @match        *://*.chaoxing.com/mycourse/studentstudy*
// @match        *://*.chaoxing.com/mooc2-ans/mycourse/studentstudy*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ==========================================
    // 🛡️ 核心修复 1：终极防暂停神盾 (解决必须删 mouseout 的问题)
    // ==========================================
    const killEvent = (e) => { 
        e.stopPropagation(); 
        e.stopImmediatePropagation(); 
    };
    // 在事件捕获阶段（最早期）直接拦截鼠标移出、失去焦点等事件
    window.addEventListener('mouseout', killEvent, true);
    window.addEventListener('mouseleave', killEvent, true);
    window.addEventListener('blur', killEvent, true);
    document.addEventListener('visibilitychange', killEvent, true);
    
    // 欺骗网页，让它永远以为自己在前台
    Object.defineProperty(document, 'hidden', { value: false });
    Object.defineProperty(document, 'visibilityState', { value: 'visible' });
    Object.defineProperty(document, 'hasFocus', { value: () => true });

    // 辅助函数：判断元素是否可见
    function isVisible(elem) {
        return !!(elem && (elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length));
    }

    window.app = {
        configs: {
            retryInterval: 1500,
            videoCheckInterval: 1000,
            guardNoProgressMs: 7000,
            guardResumeCooldownMs: 1500,
        },
        _videoEl: null,
        _isPlaying: false,
        _checkInterval: null,
        _findVideoRetry: 0,

        _getRandomDelay(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        run() {
            console.log('%c=== 学习通刷课 V7 完美养老版启动 ===', 'color:#4CAF50;font-size:16px;font-weight:bold');
            this._videoEl = null;
            if (this._checkInterval) clearInterval(this._checkInterval);
            
            // 延迟 2 秒启动，给网页一个基础的加载时间 (解决需要刷新的问题)
            setTimeout(() => this.play(), 2000);
        },

        nextUnit() {
            console.log('%c=== 准备切换到下一任务点 ===', 'color:#2196F3;font-size:14px');
            const nextBtns = document.querySelectorAll('#prevNextFocusNext, .prevNextFocusNext');
            const nextBtn = Array.from(nextBtns).find(isVisible);
            
            if (nextBtn) {
                console.log('%c👉 点击主页面“下一节”...', 'color:#FF9800');
                nextBtn.click(); 
                
                let checkPopupCount = 0;
                const checkPopupTimer = setInterval(() => {
                    checkPopupCount++;
                    const popupBtns = document.querySelectorAll('.layui-layer-btn0, .layui-layer-btn1, .bluebtn, .jb_btn, a, button');
                    const popupBtn = Array.from(popupBtns).find(btn => {
                        if (!isVisible(btn)) return false;
                        if (btn.id === 'prevNextFocusNext' || btn.classList.contains('prevNextFocusNext')) return false;
                        const text = btn.innerText.trim();
                        return ['下一节', '确定', '继续', '确认', '是'].includes(text);
                    });

                    if (popupBtn) {
                        console.log('%c🛑 捕捉到拦截弹窗，强制跳过！', 'color:#E91E63;font-weight:bold');
                        popupBtn.click();
                        clearInterval(checkPopupTimer);
                    }
                    if (checkPopupCount >= 6) clearInterval(checkPopupTimer);
                }, 500); 
                
                setTimeout(() => {
                    this._videoEl = null;
                    this.play();
                }, 5000);
            } else {
                console.log('%c❌ 未找到下一节按钮，可能是最后一节。', 'color:#F44336;font-weight:bold');
            }
        },

        _startVideoMonitoring() {
            if (this._checkInterval) clearInterval(this._checkInterval);
            this._guardLastTime = 0;
            this._guardLastWallTs = 0;
            this._guardLastResumeTs = 0;
            this._checkInterval = setInterval(() => this._checkVideoStatus(), this.configs.videoCheckInterval);
        },

        _tryResumePlayback(reason) {
            const now = Date.now();
            if (now - this._guardLastResumeTs < this.configs.guardResumeCooldownMs) return;
            this._guardLastResumeTs = now;

            const video = this._getVideoEl();
            if (!video || !this._isPlaying) return;

            video.play().catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
        },

        _checkVideoStatus() {
            try {
                const video = this._getVideoEl();
                if (!video) return;

                if (video.paused && this._isPlaying) {
                    this._tryResumePlayback('被系统暂停，强行恢复');
                } else if (this._isPlaying && !video.ended) {
                    const now = Date.now();
                    const current = Number(video.currentTime || 0);
                    if (this._guardLastWallTs === 0) {
                        this._guardLastWallTs = now;
                        this._guardLastTime = current;
                    } else {
                        const stalled = Math.abs(current - this._guardLastTime) < 0.01;
                        const stalledMs = now - this._guardLastWallTs;
                        if (stalled && stalledMs >= this.configs.guardNoProgressMs) {
                            this._tryResumePlayback('卡顿停滞');
                            this._guardLastWallTs = now;
                            this._guardLastTime = Number(video.currentTime || 0);
                        } else if (!stalled) {
                            this._guardLastWallTs = now;
                            this._guardLastTime = current;
                        }
                    }
                }
            } catch (e) { }
        },

        async play() {
           try {
                const el = this._getVideoEl();
                
                // ==========================================
                // 🛡️ 核心修复 2：智能判定是否需要继续等待加载
                // ==========================================
                if (el == null) {
                    this._findVideoRetry++;
                    
                    // 检查页面里有没有视频的“外壳”(iframe)。如果有外壳，说明视频只是网速慢还没加载出来，死等它！
                    const hasVideoFrame = document.querySelectorAll('iframe').length > 0;
                    const maxRetries = hasVideoFrame ? 20 : 6; // 有框就等 30 秒(20*1.5s)，没框就等 9 秒(6*1.5s)
                    
                    if (this._findVideoRetry < maxRetries) {
                        console.log(`%c⏳ 正在等待视频组件加载... (${this._findVideoRetry}/${maxRetries})`, 'color:#FF9800');
                        setTimeout(() => this.play(), this.configs.retryInterval);
                        return;
                    }
                    
                    this._findVideoRetry = 0;
                    console.log('%c===========确认当前页面无视频(测验/图文)，准备跳过==============', 'color:#607D8B');
                    this.nextUnit(); 
                    return;
                }

                this._findVideoRetry = 0;
                this._isPlaying = true;
                this._videoEventHandle();
                
                try {
                    await el.play();
                    console.log(`%c▶️ 视频开始正常播放，鼠标防移出神盾已激活！`, 'color:#4CAF50;font-weight:bold');
                    this._startVideoMonitoring();
                } catch (playError) {
                    el.muted = true;
                    el.play().catch(()=>{});
                }
            } catch (e) {
                setTimeout(() => this.play(), this.configs.retryInterval);
            }
        },

        _getVideoEl() {
            if (!this._videoEl) {
                try {
                    const frames = document.querySelectorAll('iframe');
                    if (frames.length === 0) return null;
                    const outerFrame = frames[0];
                    if (!outerFrame.contentDocument) return null;
                    const innerFrame = outerFrame.contentDocument.querySelector('iframe.ans-insertvideo-online');
                    if (!innerFrame || !innerFrame.contentDocument) return null;
                    this._videoEl = innerFrame.contentDocument.querySelector('video#video_html5_api');
                } catch (e) { return null; }
            }
            return this._videoEl;
        },

        _videoEventHandle() {
            const el = this._videoEl;
            if (!el) return;
            el.removeEventListener('ended', this._handleVideoEnded.bind(this));
            el.addEventListener('ended', this._handleVideoEnded.bind(this));
        },

        _handleVideoEnded(e) {
            console.warn(`%c✅============ 视频播放完成 =============`, 'color:#4CAF50;font-weight:bold');
            this._isPlaying = false;
            if (this._checkInterval) clearInterval(this._checkInterval);
            const delay = this._getRandomDelay(3000, 7000); 
            console.log(`%c⏳ 发呆 ${(delay/1000).toFixed(1)} 秒后跳转...`, 'color:#9C27B0');
            setTimeout(() => this.nextUnit(), delay);
        }
    };

    // ==========================================
    // 🛡️ 新增模块：前端智能验证码保安
    // ==========================================
    function startCaptchaMonitor() {
        const CAPTCHA_KEYWORDS = ["验证码", "安全验证", "滑块", "拼图", "人机验证"];
        console.log('%c🛡️ 验证码/风控后台监控已启动...', 'color:#9C27B0;font-size:12px');
        
        setInterval(() => {
            try {
                // 仅在最顶层页面或带有内容的页面进行扫描
                if (document.body) {
                    const pageText = document.body.innerText || '';
                    for (const keyword of CAPTCHA_KEYWORDS) {
                        if (pageText.includes(keyword)) {
                            console.log(`%c⚠️ 触发风控拦截！检测到关键词: [${keyword}]`, 'color:red;font-weight:bold;font-size:14px');
                            console.log(`%c🔄 正在自动刷新页面绕过检测...`, 'color:#FF9800');
                            
                            // 延迟3秒后自动刷新当前页面，绕过风控检测
                            setTimeout(() => {
                                window.location.reload();
                            }, 3000);
                            break; 
                        }
                    }
                }
            } catch(e) {}
        }, 5000); // 每5秒钟巡查一次
    }

    try {
        window.app.run();
        startCaptchaMonitor(); // 启动验证码监控
    } catch (error) {
        console.error('脚本初始化失败: ', error.message);
    }
})();