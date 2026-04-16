# 001 SymbiNexus UI层与路由实现

## 完成时间
2026-04-14

## 实现内容

### 1. 主题系统
- 文件: `lib/app/theme.dart`
- Material 3 主题，主色 #6750A4
- 亮色/暗色模式支持
- 定义了卡片、按钮、输入框、FAB、底部导航、AppBar、对话框、芯片等组件主题
- 定义了完整 TextTheme 样式

### 2. 底部导航 Shell
- 文件: `lib/app/main_shell.dart` (新建)
- 5个tab: 首页/任务/录入(中间突出)/账务/备忘
- 中间录入按钮使用自定义样式突出显示
- 使用 NavigationBar (Material 3)

### 3. 路由系统
- 文件: `lib/app/router.dart`
- GoRouter + StatefulShellRoute.indexedStack
- 底部导航5个分支: /, /tasks, /smart-input, /bills, /memos
- 独立页面: /search, /settings (无底部导航)

### 4. 首页 HomePage
- 文件: `lib/features/home/presentation/home_page.dart` (新建)
- 日期显示 + 问候语
- 今日任务概览卡片(待办/已完成/总计)
- 今日账单概览卡片(支出/收入)
- 快速录入大按钮

### 5. 智能录入页 SmartInputPage
- 文件: `lib/features/smart_input/presentation/smart_input_page.dart`
- 多行文本输入框 + 语音输入图标
- 提交按钮(带加载状态)
- AI分类结果展示(类别标签+结构化数据+确认/丢弃)
- 最近录入历史(最近10条AI日志)

### 6. 账务页 BillsPage
- 文件: `lib/features/bills/presentation/bills_page.dart`
- 月份选择器(左右切换)
- 月度统计卡片(支出/收入/结余)
- 当月账单列表(按日期倒序，支出红色/收入绿色)
- 浮动按钮跳转快速录入

### 7. 任务页 TasksPage
- 文件: `lib/features/tasks/presentation/tasks_page.dart`
- 日期筛选(今天/明天/全部) SegmentedButton
- 任务列表(按优先级排序)
- checkbox切换完成状态
- 优先级标签(高/中/低)

### 8. 备忘页 MemosPage
- 文件: `lib/features/memos/presentation/memos_page.dart`
- 备忘列表(置顶优先，按更新时间倒序)
- 滑动删除(Dismissible)
- 置顶切换(图钉图标)

### 9. 搜索页 SearchPage
- 文件: `lib/features/search/presentation/search_page.dart`
- 搜索框 + 分类筛选(全部/任务/账单/备忘)
- 高亮匹配文本
- 搜索结果列表(数据库查询待实现)

### 10. 设置页 SettingsPage
- 文件: `lib/features/settings/presentation/settings_page.dart` (新建)
- Vault路径配置(对话框)
- 8个LLM提供商API密钥管理(安全存储)
- 默认模型选择(待实现)
- 通知开关(任务提醒/备忘提醒)
- 关于信息

### 11. Providers
- 文件: `lib/core/providers/providers.dart`
- databaseProvider: 全局AppDatabase实例，自动释放

## 注意事项
- Flutter SDK 未在终端 PATH 中，未执行 `flutter analyze` 验证
- 代码已通过手动审查，导入和类型使用正确
- 搜索页的数据库查询标记为 TODO，待全文索引实现后补充
- AI Pipeline 调用标记为 TODO，当前使用模拟结果
