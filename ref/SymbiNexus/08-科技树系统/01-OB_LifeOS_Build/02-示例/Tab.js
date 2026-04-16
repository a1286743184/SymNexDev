// 假设这是你的插件配置页类
class MyPluginSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        // 1. 初始化 SIP UI 助手
        const ui = new SipUiHelper(containerEl);

        // 2. 创建 Tabs
        const tabs = ui.createTabs(['基础设置', '高级功能', '关于']);

        // =====================================
        // Tab 1: 基础设置
        // =====================================
        const basicTab = tabs.get('基础设置');
        
        // 创建分组卡片 1
        const generalCard = ui.createCard(basicTab, '常规配置', '管理插件的基础运行参数');
        
        // 将原生的 Setting 挂载到 generalCard 上，而不是 containerEl
        new Setting(generalCard)
            .setName('快捷键唤醒')
            .setDesc('是否允许使用全局快捷键唤醒面板')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableHotkey)
                .onChange(async (value) => {
                    this.plugin.settings.enableHotkey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(generalCard)
            .setName('默认存储路径')
            .setDesc('新建内容的默认归档文件夹')
            .addText(text => text
                .setPlaceholder('例如: Inbox/')
                .setValue(this.plugin.settings.defaultPath)
                .onChange(async (value) => {
                    this.plugin.settings.defaultPath = value;
                    await this.plugin.saveSettings();
                }));

        // 创建分组卡片 2
        const apiCard = ui.createCard(basicTab, '服务状态', '查看当前后台服务的连通性');
        
        const statusContainer = apiCard.createDiv({ style: 'padding: 8px 0;' });
        // 调用纯净状态指示器
        ui.createStatusTag(statusContainer, '引擎在线', 'success');

        // =====================================
        // Tab 2: 高级功能
        // =====================================
        const advancedTab = tabs.get('高级功能');
        const advancedCard = ui.createCard(advancedTab, '实验性功能', '可能会影响稳定性的高级设置');
        
        new Setting(advancedCard)
            .setName('开启严格模式')
            .setDesc('拦截非标准的格式输入')
            .addToggle(toggle => toggle.setValue(false));
    }
}