# SymNex Flutter 项目实现状态全面分析报告

> 分析时间: 2026-04-16 | 项目路径: d:\DevEnv\SymNex
> 总文件数: 49个 .dart 文件 (lib/ 47个, test/ 1个, integration_test/ 3个)

---

## 一、项目结构总览

```
d:\DevEnv\SymNex\lib\
  main.dart                          # 应用入口
  app/
    app.dart                         # MaterialApp 根组件
    router.dart                      # GoRouter 路由配置
    main_shell.dart                  # 底部导航 Shell
    theme.dart                       # Material 3 主题
  core/
    database/
      database.dart                  # Drift 数据库定义 (11表)
      database.g.dart                # 生成代码
      connection.dart                # 数据库连接 (备用)
      tables/
        bills.dart                   # 账单表
        tasks.dart                   # 任务表
        memos.dart                   # 备忘表
        contacts.dart                # 联系人表
        price_records.dart           # 价格记录表
        pet_growth.dart              # 宠物成长表
        question_entries.dart        # 问题条目表
        food_wishlist.dart           # 美食心愿表
        study_records.dart           # 学习记录表
        code_devs.dart               # 代码开发表
        ai_logs.dart                 # AI日志表
    markdown/
      markdown_io.dart               # Markdown 文件读写
      frontmatter_parser.dart        # YAML Frontmatter 解析/序列化
      inline_field_parser.dart       # Dataview 内联字段解析
    models/
      models.dart                    # 空桶文件 (无 Freezed 模型)
    providers/
      providers.dart                 # Riverpod 全局 Provider
    services/
      ai_pipeline.dart               # 3阶段 AI 管道
      llm_router.dart                # LLM 多提供商路由 + 熔断器
      pivot_service.dart             # 枢轴偏移服务 (0-3点算前一天)
      index_sync_service.dart        # Markdown <-> SQLite 索引同步
      channel_normalizer.dart        # 支付渠道归一化
      sync_bridge.dart               # Syncthing 同步桥接
      config_bootstrap.dart          # API密钥初始化引导
  features/
    home/
      presentation/home_page.dart    # 首页 - 今日概览
    smart_input/
      presentation/smart_input_page.dart  # 智能录入页 (核心)
      logic/smart_input_logic.dart        # 空桩
    bills/
      presentation/bills_page.dart   # 账务页
      logic/bills_logic.dart         # 空桩
    tasks/
      presentation/tasks_page.dart   # 任务页
      logic/tasks_logic.dart         # 空桩
    memos/
      presentation/memos_page.dart   # 备忘页
      logic/memos_logic.dart         # 空桩
    search/
      presentation/search_page.dart  # 搜索页
      logic/search_logic.dart        # 空桩
    settings/
      presentation/settings_page.dart # 设置页
  platform/
    notifications/
      notification_service.dart      # 本地通知服务
      alarm_scheduler.dart           # 闹钟调度 (空桩)
    sync/
      file_watcher.dart              # Windows 文件监听器
      sync_monitor.dart              # 同步监控 (空桩)
      saf_accessor.dart              # Android SAF 访问 (空桩)
    widgets/
      task_overview_widget.dart      # 桌面小组件 (空桩)
      quick_input_widget.dart        # 快速录入小组件 (空桩)
```

---

## 二、各领域详细分析

### 1. 数据库 Schema (Drift)

**已实现 - 完整度: 100%**

| 表名 | 文件 | 字段数 | 状态 |
|------|------|--------|------|
| Bills | [bills.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/bills.dart) | 7 | 完整 |
| Tasks | [tasks.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/tasks.dart) | 8 | 完整 |
| Memos | [memos.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/memos.dart) | 7 | 完整 |
| Contacts | [contacts.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/contacts.dart) | 5 | 完整 |
| PriceRecords | [price_records.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/price_records.dart) | 6 | 完整 |
| PetGrowth | [pet_growth.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/pet_growth.dart) | 5 | 完整 |
| QuestionEntries | [question_entries.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/question_entries.dart) | 5 | 完整 |
| FoodWishlist | [food_wishlist.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/food_wishlist.dart) | 5 | 完整 |
| StudyRecords | [study_records.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/study_records.dart) | 5 | 完整 |
| CodeDevs | [code_devs.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/code_devs.dart) | 6 | 完整 |
| AiLogs | [ai_logs.dart](file:///d:/DevEnv/SymNex/lib/core/database/tables/ai_logs.dart) | 9 | 完整 |

- schemaVersion = 1, 无迁移逻辑
- database.g.dart 已生成
- connection.dart 存在但未被 database.dart 使用 (database.dart 自带 _openConnection)
- **缺失**: 无 DAO 层, 无自定义查询方法, 所有查询直接在 UI 层内联编写

---

### 2. AI 管道

**已实现 - 完整度: 90%**

#### AiPipeline ([ai_pipeline.dart](file:///d:/DevEnv/SymNex/lib/core/services/ai_pipeline.dart))
- 3阶段管道完整实现:
  - Stage1 `_classify()`: 11类分类, 含模糊匹配降级
  - Stage2 `_optimize()`: 语义优化, 4/11模块跳过 (question_entry/code_dev/food_wishlist/price_tracker)
  - Stage3 `_extract()`: 结构化提取, 11个独立提示词模板
- `_parseJsonResponse()`: JSON容错解析 (代码块提取 / 花括号范围 / 直接解析)
- `AiPipelineResult` 数据类: category + extractedData + optimizedText

#### LlmRouter ([llm_router.dart](file:///d:/DevEnv/SymNex/lib/core/services/llm_router.dart))
- 8个 LLM 提供商配置: 智谱/MiniMax/通义千问/MiMo/Google/豆包/阿里/LongCat
- 双协议支持: OpenAI 兼容 + Anthropic 兼容
- 熔断器 `_CircuitBreaker`: 5分钟冷却期
- `callWithFallback()`: 按优先级自动降级
- API 密钥通过 FlutterSecureStorage 管理
- **缺失**: 无流式响应、无 token 计数、无费用追踪、无模型选择 UI 逻辑

#### 提示词模板
- 11个分类提示词 (Stage1)
- 1个语义优化提示词 (Stage2)
- 11个结构化提取提示词 (Stage3), 每个模块独立 JSON schema

**部分实现**: AI日志记录在 SmartInputPage 中内联完成, 未抽取为独立服务

---

### 3. 核心服务

#### PivotService ([pivot_service.dart](file:///d:/DevEnv/SymNex/lib/core/services/pivot_service.dart))
- **完整实现**: `getLogicalDate()` / `getLogicalDateStr()`
- 0:00-3:00 逻辑日期偏移为前一天
- 支持测试注入 (可选 now 参数)

#### MarkdownIO ([markdown_io.dart](file:///d:/DevEnv/SymNex/lib/core/markdown/markdown_io.dart))
- **完整实现**:
  - `readFile()` / `writeFile()`: 基础读写
  - `readWithFrontmatter()` / `writeWithFrontmatter()`: 带 frontmatter 读写
  - `updateFrontmatter()`: 增量更新 frontmatter
  - `exists()` / `deleteFile()` / `listFiles()`: 文件操作
  - 支持自定义 vaultPath
- **缺失**: 无文件锁定机制, 无并发写入保护

#### IndexSyncService ([index_sync_service.dart](file:///d:/DevEnv/SymNex/lib/core/services/index_sync_service.dart))
- **完整实现**:
  - `rebuildIndex()`: 全量索引重建
  - `syncFile()`: 增量单文件同步
  - `onFileWritten()`: 写入后同步, 11个模块各自同步方法
  - `_dirModuleMap`: 目录名到模块类型的映射
  - 驼峰/下划线双格式字段名兼容
- **缺失**: 未被任何 Provider 或 UI 调用 (仅注册了 Provider, 但无触发点)

#### ChannelNormalizer ([channel_normalizer.dart](file:///d:/DevEnv/SymNex/lib/core/services/channel_normalizer.dart))
- **完整实现**: 16个渠道别名映射, `normalize()` / `standardChannels`

#### SyncBridge ([sync_bridge.dart](file:///d:/DevEnv/SymNex/lib/core/services/sync_bridge.dart))
- **完整实现**:
  - `watchVaultDirectory()`: 文件变更监听
  - `detectConflicts()`: Syncthing 冲突文件检测
  - `checkSyncthingStatus()`: Syncthing REST API 状态查询
  - `getFolderCompletion()`: 文件夹同步进度
  - `requestRescan()`: 请求重新扫描
  - `deleteConflictFile()`: 删除冲突文件
- **缺失**: 未被 UI 集成, 无冲突解决 UI

#### ConfigBootstrap ([config_bootstrap.dart](file:///d:/DevEnv/SymNex/lib/core/services/config_bootstrap.dart))
- **完整实现**: 从 assets/secrets.json 读取 API 密钥并写入 SecureStorage
- 仅首次运行执行 (标记 config_bootstrapped)
- **注意**: assets/secrets.json 文件不存在 (Glob 未找到)

---

### 4. 功能模块

#### 4.1 Bill (账务)
- **UI 完整度: 80%**
  - [bills_page.dart](file:///d:/DevEnv/SymNex/lib/features/bills/presentation/bills_page.dart): 月选择器 + 月度汇总卡片 + 账单列表
  - 分类图标映射 (餐饮/交通/购物/娱乐/医疗/教育/工资)
  - 支出/收入/结余统计
- **Logic 层**: 空桩 ([bills_logic.dart](file:///d:/DevEnv/SymNex/lib/features/bills/logic/bills_logic.dart))
- **缺失**: 无账单编辑/删除 UI, 无分类统计图表, 无预算功能, 月选择器未与列表联动 (列表固定当前月)

#### 4.2 Task (任务)
- **UI 完整度: 75%**
  - [tasks_page.dart](file:///d:/DevEnv/SymNex/lib/features/tasks/presentation/tasks_page.dart): 日期筛选 (今天/明天/全部) + 任务列表
  - 任务完成切换, 优先级标签 (高/中/低)
  - 排序: 优先级 + 截止日期
- **Logic 层**: 空桩 ([tasks_logic.dart](file:///d:/DevEnv/SymNex/lib/features/tasks/logic/tasks_logic.dart))
- **缺失**: 日期筛选器 UI 存在但未与查询联动 (查询无 where 过滤), 无任务编辑 UI, 无子任务, 无标签筛选

#### 4.3 Memo (备忘)
- **UI 完整度: 80%**
  - [memos_page.dart](file:///d:/DevEnv/SymNex/lib/features/memos/presentation/memos_page.dart): 备忘列表
  - 置顶切换, 滑动删除 (Dismissible)
  - 排序: 置顶优先 + 更新时间倒序
- **Logic 层**: 空桩 ([memos_logic.dart](file:///d:/DevEnv/SymNex/lib/features/memos/logic/memos_logic.dart))
- **缺失**: 无备忘编辑 UI, 无内容详情页, 无标签筛选

#### 4.4 Contact (联系人)
- **UI 完整度: 0%** - 无独立页面
- 数据库表已定义, AI 管道可提取, SmartInputPage 可保存
- **缺失**: 无联系人列表/详情/编辑页, 无路由

#### 4.5 PriceTracker (价格追踪)
- **UI 完整度: 0%** - 无独立页面
- 数据库表已定义, AI 管道可提取, SmartInputPage 可保存
- **缺失**: 无价格列表/趋势图/比价页, 无路由

#### 4.6 PetGrowth (宠物成长)
- **UI 完整度: 0%** - 无独立页面
- 数据库表已定义, AI 管道可提取, SmartInputPage 可保存
- **缺失**: 无宠物档案/成长记录页, 无路由

#### 4.7 QuestionEntry (问题条目)
- **UI 完整度: 0%** - 无独立页面
- 数据库表已定义, AI 管道可提取, SmartInputPage 可保存
- **缺失**: 无问题列表/问答页, 无路由

#### 4.8 FoodWishlist (美食心愿)
- **UI 完整度: 0%** - 无独立页面
- 数据库表已定义, AI 管道可提取, SmartInputPage 可保存
- **缺失**: 无美食列表/状态切换页, 无路由

#### 4.9 StudyRecord (学习记录)
- **UI 完整度: 0%** - 无独立页面
- 数据库表已定义, AI 管道可提取, SmartInputPage 可保存
- **缺失**: 无学习统计/记录页, 无路由

#### 4.10 CodeDev (代码开发)
- **UI 完整度: 0%** - 无独立页面
- 数据库表已定义, AI 管道可提取, SmartInputPage 可保存
- **缺失**: 无项目列表/详情页, 无路由

#### 4.11 SmartInput (智能录入)
- **UI 完整度: 95%**
  - [smart_input_page.dart](file:///d:/DevEnv/SymNex/lib/features/smart_input/presentation/smart_input_page.dart): 完整的 AI 录入流程
  - 输入 -> AI 处理 -> 结果展示 -> 确认/丢弃 -> 保存到对应表
  - 11个分类的路由保存逻辑
  - AI 日志记录
  - 最近录入历史 (基于 AiLogs 表)
- **Logic 层**: 空桩 ([smart_input_logic.dart](file:///d:/DevEnv/SymNex/lib/features/smart_input/logic/smart_input_logic.dart))
- **缺失**: 语音输入 (占位), 结果字段编辑 (确认前不可修改)

---

### 5. UI 页面

| 页面 | 文件 | 状态 | 导航位置 |
|------|------|------|----------|
| 首页 | [home_page.dart](file:///d:/DevEnv/SymNex/lib/features/home/presentation/home_page.dart) | 已实现 | 底部导航 Tab 0 |
| 任务页 | [tasks_page.dart](file:///d:/DevEnv/SymNex/lib/features/tasks/presentation/tasks_page.dart) | 已实现 | 底部导航 Tab 1 |
| 智能录入 | [smart_input_page.dart](file:///d:/DevEnv/SymNex/lib/features/smart_input/presentation/smart_input_page.dart) | 已实现 | 底部导航 Tab 2 |
| 账务页 | [bills_page.dart](file:///d:/DevEnv/SymNex/lib/features/bills/presentation/bills_page.dart) | 已实现 | 底部导航 Tab 3 |
| 备忘页 | [memos_page.dart](file:///d:/DevEnv/SymNex/lib/features/memos/presentation/memos_page.dart) | 已实现 | 底部导航 Tab 4 |
| 搜索页 | [search_page.dart](file:///d:/DevEnv/SymNex/lib/features/search/presentation/search_page.dart) | 骨架 | 独立路由 /search |
| 设置页 | [settings_page.dart](file:///d:/DevEnv/SymNex/lib/features/settings/presentation/settings_page.dart) | 部分实现 | 独立路由 /settings |

**缺失页面**: 联系人/价格追踪/宠物成长/问题条目/美食心愿/学习记录/代码开发 -- 7个模块无独立页面

---

### 6. 状态管理 (Riverpod)

[providers.dart](file:///d:/DevEnv/SymNex/lib/core/providers/providers.dart) 定义了 9 个全局 Provider:

| Provider | 类型 | 状态 |
|----------|------|------|
| databaseProvider | AppDatabase | 已实现 |
| markdownIoProvider | MarkdownIo | 已实现 |
| llmRouterProvider | LlmRouter | 已实现 |
| aiPipelineServiceProvider | AiPipeline | 已实现 |
| channelNormalizerServiceProvider | ChannelNormalizer | 已实现 |
| pivotServiceProvider | PivotService | 已实现 |
| notificationServiceProvider | NotificationService | 已实现 |
| fileWatcherProvider | FileWatcher | 已实现 |
| syncBridgeProvider | SyncBridge | 已实现 |
| indexSyncServiceProvider | IndexSyncService | 已实现 |

**缺失**:
- 无 feature 级别 Provider (各模块 logic 层为空)
- 无 AsyncNotifier/Notifier 实现
- 所有 UI 直接操作 databaseProvider, 无业务逻辑封装层
- 未使用 riverpod_generator / riverpod_annotation (虽在 dev_dependencies 中)

---

### 7. 平台集成

#### 通知服务 ([notification_service.dart](file:///d:/DevEnv/SymNex/lib/platform/notifications/notification_service.dart))
- **完整实现**:
  - `init()`: 初始化 + 时区设置 (Asia/Shanghai)
  - `requestPermission()`: Android 13+ 权限请求
  - `showNotification()`: 即时通知
  - `scheduleNotification()`: 定时通知 (zonedSchedule)
  - `cancel()` / `cancelAll()`: 取消通知
- **缺失**: 未在 main.dart 中初始化, 未与任务/备忘到期逻辑集成

#### AlarmScheduler ([alarm_scheduler.dart](file:///d:/DevEnv/SymNex/lib/platform/notifications/alarm_scheduler.dart))
- **空桩**: 仅类声明 + TODO

#### FileWatcher ([file_watcher.dart](file:///d:/DevEnv/SymNex/lib/platform/sync/file_watcher.dart))
- **完整实现**:
  - `watch()`: 返回 FileChangeEvent 流
  - 防抖机制 (100ms)
  - 仅监控 .md 文件
  - 4种事件类型: create/modify/delete/move

#### SyncMonitor ([sync_monitor.dart](file:///d:/DevEnv/SymNex/lib/platform/sync/sync_monitor.dart))
- **空桩**: 仅类声明 + TODO

#### SafAccessor ([saf_accessor.dart](file:///d:/DevEnv/SymNex/lib/platform/sync/saf_accessor.dart))
- **空桩**: 仅类声明 + TODO

#### 桌面小组件
- TaskOverviewWidget ([task_overview_widget.dart](file:///d:/DevEnv/SymNex/lib/platform/widgets/task_overview_widget.dart)): **空桩**
- QuickInputWidget ([quick_input_widget.dart](file:///d:/DevEnv/SymNex/lib/platform/widgets/quick_input_widget.dart)): **空桩**
- pubspec.yaml 中 home_widget 和 workmanager 已注释掉 (deferred to Phase 3)

---

### 8. 数据迁移

- **完全缺失**: 无迁移工具实现
- database.dart schemaVersion = 1, 无 onUpgrade 回调
- 无 Obsidian Vault 数据导入工具
- 无旧版数据迁移脚本
- connection.dart 存在但未被使用, 可能是早期设计残留

---

### 9. 配置层

#### Router ([router.dart](file:///d:/DevEnv/SymNex/lib/app/router.dart))
- **完整实现**: GoRouter + StatefulShellRoute
- 5个底部导航分支: 首页/任务/录入/账务/备忘
- 2个独立路由: /search, /settings
- NavTab 枚举定义

#### Theme ([theme.dart](file:///d:/DevEnv/SymNex/lib/app/theme.dart))
- **完整实现**: Material 3 主题
- seedColor: #6750A4 (紫色)
- 明暗双主题
- 完整的组件主题覆盖: Card/Button/Input/FAB/NavigationBar/AppBar/Dialog/Chip

#### MainShell ([main_shell.dart](file:///d:/DevEnv/SymNex/lib/app/main_shell.dart))
- **完整实现**: NavigationBar 底部导航
- 中间"录入"按钮突出显示 (自定义样式)
- 5个导航项

#### Models ([models.dart](file:///d:/DevEnv/SymNex/lib/core/models/models.dart))
- **空桶文件**: 仅注释 "Freezed data models will be generated here"
- 未使用 freezed_annotation / json_annotation (虽在 dependencies 中)

---

## 三、TODO/FIXME/HACK 标记汇总

共 14 处 TODO, 0 处 FIXME, 0 处 HACK:

| 文件 | 行号 | 内容 | 优先级 |
|------|------|------|--------|
| settings_page.dart | 92 | 保存通知设置 | 中 |
| settings_page.dart | 100 | 保存通知设置 | 中 |
| settings_page.dart | 148 | 实现模型选择 | 高 |
| settings_page.dart | 209 | 保存Vault路径 | 高 |
| search_page.dart | 120 | 使用全文索引搜索 | 中 |
| search_page.dart | 155 | 跳转详情页 | 中 |
| search_page.dart | 165 | 实现数据库查询 (tasks) | 高 |
| search_page.dart | 171 | 实现数据库查询 (bills) | 高 |
| search_page.dart | 177 | 实现数据库查询 (memos) | 高 |
| alarm_scheduler.dart | 7 | 实现闹钟调度逻辑 | 低 |
| sync_monitor.dart | 8 | 实现同步状态监控 | 低 |
| saf_accessor.dart | 8 | 实现 SAF 访问 (Android) | 低 |
| task_overview_widget.dart | 7 | 实现桌面小组件 | 低 |
| quick_input_widget.dart | 7 | 实现快速录入小组件 | 低 |

---

## 四、架构问题与风险

### 高风险

1. **UI 层直接操作数据库**: 所有页面直接使用 `db.select()` / `db.into().insert()`, 无 Repository/Service 层隔离。SmartInputPage._onConfirm() 有 200+ 行的 switch-case 数据库写入逻辑。
2. **Logic 层全部空桩**: 6个 feature 的 logic/ 目录仅有注释, 业务逻辑散落在 presentation 层。
3. **搜索功能不可用**: SearchPage 的三个搜索方法返回空列表, 搜索功能完全无效。
4. **7个模块无 UI**: 联系人/价格追踪/宠物成长/问题条目/美食心愿/学习记录/代码开发 -- 数据只能通过 AI 录入写入, 无法查看/编辑/删除。
5. **assets/secrets.json 缺失**: ConfigBootstrap 引用此文件但不存在, 首次启动会静默失败。

### 中风险

6. **月选择器未联动**: BillsPage 的 _MonthSelector 和 _BillList 使用不同的日期范围 (选择器有状态但未共享)。
7. **任务日期筛选未联动**: TasksPage 的 _DateFilter UI 存在但查询无 where 过滤。
8. **IndexSyncService 未被触发**: 虽然完整实现, 但无代码调用 rebuildIndex() 或 syncFile()。
9. **NotificationService 未初始化**: main.dart 中未调用 NotificationService.init()。
10. **Freezed 未使用**: models.dart 为空, 未利用 freezed_annotation 依赖。
11. **connection.dart 重复**: database.dart 自带 _openConnection(), connection.dart 是冗余的。

### 低风险

12. **riverpod_generator 未使用**: 虽在 dev_dependencies, Provider 全部手写。
13. **无单元测试**: test/ 仅有占位测试 (1+1=2)。
14. **集成测试依赖 Patrol**: 需要原生环境运行, 无法在 CI 中轻松执行。

---

## 五、实现状态矩阵

| 模块 | 数据库 | AI管道 | UI页面 | Logic层 | 搜索 | 通知 |
|------|--------|--------|--------|---------|------|------|
| Bill | 完整 | 完整 | 80% | 空 | 无 | 无 |
| Task | 完整 | 完整 | 75% | 空 | 无 | 无 |
| Memo | 完整 | 完整 | 80% | 空 | 无 | 无 |
| Contact | 完整 | 完整 | 0% | 空 | 无 | 无 |
| PriceTracker | 完整 | 完整 | 0% | 空 | 无 | 无 |
| PetGrowth | 完整 | 完整 | 0% | 空 | 无 | 无 |
| QuestionEntry | 完整 | 完整 | 0% | 空 | 无 | 无 |
| FoodWishlist | 完整 | 完整 | 0% | 空 | 无 | 无 |
| StudyRecord | 完整 | 完整 | 0% | 空 | 无 | 无 |
| CodeDev | 完整 | 完整 | 0% | 空 | 无 | 无 |
| AiLogs | 完整 | N/A | (在SmartInput中) | N/A | 无 | 无 |

---

## 六、总结

SymNex 项目的**基础设施层已基本完成** (数据库11表、AI管道3阶段、LLM路由8提供商、Markdown读写、索引同步、文件监听、通知服务), 但**功能层实现严重不均衡**:

- **已完成的核心闭环**: 智能录入 -> AI分类/提取 -> 保存到数据库 (11个模块均可写入)
- **严重缺失**: 7个模块无独立UI (只能写不能看), 搜索功能不可用, 业务逻辑层为空, 无数据编辑/删除能力
- **架构债务**: UI直接操作数据库, 无分层隔离; Freezed/Riverpod Generator 等已引入依赖未使用

项目当前处于"管道已通、界面不全"的阶段, 核心AI录入流程可用, 但作为完整应用尚不可用。
