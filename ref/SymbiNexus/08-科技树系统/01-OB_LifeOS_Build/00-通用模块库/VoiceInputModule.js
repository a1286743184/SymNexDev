/**
 * 语音录入通用模块
 * 提供跨平台的语音录入功能，支持MacroDroid自动化触发
 * 
 * @author LifeOS
 * @version 1.0.0
 * @date 2025-01-27
 */

class VoiceInputModule {
    constructor() {
        this.isAndroid = this.detectPlatform();
        this.webhookEnabled = this.shouldEnableWebhook();
    }

    /**
     * 检测当前平台是否为Android
     * @returns {boolean} 是否为Android平台
     */
    detectPlatform() {
        try {
            // 在Obsidian环境中检测平台
            if (typeof app !== 'undefined' && app.isMobile) {
                return true;
            }
            // 通过用户代理检测
            if (typeof navigator !== 'undefined') {
                return /Android/i.test(navigator.userAgent);
            }
            return false;
        } catch (error) {
            console.warn('平台检测失败，默认为桌面端:', error);
            return false;
        }
    }

    /**
     * 判断是否应该启用Webhook功能
     * @returns {boolean} 是否启用Webhook
     */
    shouldEnableWebhook() {
        return this.isAndroid;
    }

    /**
     * 语音录入触发器类
     * 负责处理MacroDroid的Webhook触发
     */
    createVoiceInputTrigger() {
        if (!this.webhookEnabled) {
            return null;
        }

        return new VoiceInputTrigger();
    }

    /**
     * 获取语音输入
     * 根据平台选择合适的输入方式
     * @param {string} prompt - 输入提示文本
     * @param {Object} options - 配置选项
     * @returns {Promise<string>} 用户输入的文本
     */
    async getVoiceInput(prompt = "请输入内容", options = {}) {
        const {
            enableVoice = true,
            fallbackToText = true,
            timeout = 300000 // 5分钟超时
        } = options;

        // Android平台且启用语音输入
        if (this.isAndroid && enableVoice && this.webhookEnabled) {
            try {
                return await this.getVoiceInputAndroid(prompt, timeout);
            } catch (error) {
                console.warn('语音输入失败，回退到文本输入:', error);
                if (fallbackToText) {
                    return await this.getTextInput(prompt);
                }
                throw error;
            }
        }

        // 桌面端或回退到文本输入
        return await this.getTextInput(prompt);
    }

    /**
     * Android平台语音输入
     * 通过MacroDroid自动化实现
     * @param {string} prompt - 输入提示
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<string>} 语音识别结果
     */
    async getVoiceInputAndroid(prompt, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            let isResolved = false;

            // 设置超时
            timeoutId = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    reject(new Error('语音输入超时'));
                }
            }, timeout);

            // 创建语音输入触发器
            const voiceTrigger = this.createVoiceInputTrigger();
            if (!voiceTrigger) {
                clearTimeout(timeoutId);
                reject(new Error('无法创建语音输入触发器'));
                return;
            }

            // 设置回调函数
            voiceTrigger.onVoiceResult = (result) => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeoutId);
                    resolve(result);
                }
            };

            voiceTrigger.onError = (error) => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeoutId);
                    reject(new Error(`语音输入错误: ${error}`));
                }
            };

            // 显示提示并触发MacroDroid
            this.showVoiceInputPrompt(prompt);
            voiceTrigger.triggerMacroDroid();
        });
    }

    /**
     * 文本输入（回退方案）
     * @param {string} prompt - 输入提示
     * @returns {Promise<string>} 用户输入的文本
     */
    async getTextInput(prompt) {
        // 在QuickAdd环境中使用qa.inputPrompt
        if (typeof qa !== 'undefined' && qa.inputPrompt) {
            return await qa.inputPrompt(prompt);
        }

        // 在普通环境中使用prompt
        return new Promise((resolve) => {
            const result = window.prompt(prompt);
            resolve(result || '');
        });
    }

    /**
     * 显示语音输入提示
     * @param {string} prompt - 提示文本
     */
    showVoiceInputPrompt(prompt) {
        // 在Obsidian中显示通知
        if (typeof app !== 'undefined' && app.workspace) {
            new Notice(`${prompt}\n正在启动语音输入...`, 3000);
        } else {
            console.log(`语音输入提示: ${prompt}`);
        }
    }

    /**
     * 获取模块信息
     * @returns {Object} 模块信息
     */
    getModuleInfo() {
        return {
            name: 'VoiceInputModule',
            version: '1.0.0',
            platform: this.isAndroid ? 'Android' : 'Desktop',
            webhookEnabled: this.webhookEnabled,
            description: '跨平台语音录入通用模块'
        };
    }
}

/**
 * 语音输入触发器类
 * 负责与MacroDroid的Webhook通信
 */
class VoiceInputTrigger {
    constructor() {
        this.webhookUrl = 'https://trigger.macrodroid.com/your-webhook-id'; // 需要配置实际的Webhook URL
        this.onVoiceResult = null;
        this.onError = null;
        this.setupWebhookListener();
    }

    /**
     * 设置Webhook监听器
     * 监听来自MacroDroid的语音识别结果
     */
    setupWebhookListener() {
        // 这里需要根据实际的Webhook实现方式来调整
        // 可能需要通过轮询、WebSocket或其他方式接收结果
        console.log('语音输入触发器已初始化');
    }

    /**
     * 触发MacroDroid自动化
     * 发送Webhook请求启动语音录入流程
     */
    async triggerMacroDroid() {
        try {
            // 发送触发请求到MacroDroid
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'start_voice_input',
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`Webhook请求失败: ${response.status}`);
            }

            console.log('MacroDroid语音输入已触发');
        } catch (error) {
            console.error('触发MacroDroid失败:', error);
            if (this.onError) {
                this.onError(error.message);
            }
        }
    }

    /**
     * 处理语音识别结果
     * @param {string} result - 语音识别的文本结果
     */
    handleVoiceResult(result) {
        if (this.onVoiceResult) {
            this.onVoiceResult(result);
        }
    }

    /**
     * 处理错误
     * @param {string} error - 错误信息
     */
    handleError(error) {
        if (this.onError) {
            this.onError(error);
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoiceInputModule, VoiceInputTrigger };
} else if (typeof window !== 'undefined') {
    window.VoiceInputModule = VoiceInputModule;
    window.VoiceInputTrigger = VoiceInputTrigger;
}

// 创建全局实例（可选）
if (typeof window !== 'undefined') {
    window.voiceInputModule = new VoiceInputModule();
}