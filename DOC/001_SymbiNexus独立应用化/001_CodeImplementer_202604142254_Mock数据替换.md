# 001 SymbiNexus独立应用化 - Mock数据替换为真实AI管道和数据库

## 修改文件清单

### 1. providers.dart - 新增4个服务Provider
- `llmRouterProvider` - LLM路由服务
- `aiPipelineServiceProvider` - AI管道服务（依赖LlmRouter）
- `channelNormalizerServiceProvider` - 渠道归一化服务
- `pivotServiceProvider` - 枢轴偏移服务

### 2. smart_input_page.dart - 接入AI管道（核心修改）
- 移除 `_mockAiResult()` 方法
- `_onSubmit()` 改为调用 `pipeline.process(input)` 执行3阶段AI管道
- 记录AI日志到 aiLogs 表（含延迟计时）
- `_onConfirm()` 根据 categoryKey 路由写入11个数据库表
- AiResult 类新增 `categoryKey` 字段用于数据库路由
- bill 分类写入时调用 ChannelNormalizer 归一化渠道
- 所有分类均有对应的 Companion.insert 写入逻辑

### 3. home_page.dart - 接入枢轴偏移
- 移除顶层 `_todayStart()` 函数
- HomePage/TodayTasksCard/TodayBillsCard 均使用 `pivotServiceProvider` 获取逻辑日期
- 问候语基于逻辑日期计算

### 4. bills_page.dart - 渠道归一化显示
- subtitle 中添加 channel 字段显示：`类别 | 渠道 - 备注`

### 5. settings_page.dart - 修正LLM提供商列表
- 将8个提供商从 (openai/anthropic/google/deepseek/zhipu/moonshot/qwen/ollama)
- 修正为与 LlmRouter 一致：(zhipu/minimax/qwen/mimo/google/doubao/aliyun/longcat)

### 6. 验证无需修改的文件
- tasks_page.dart - `_toggleTask` 已正确写入数据库
- memos_page.dart - `_deleteMemo` 和 `_togglePin` 已正确操作数据库

## 注意事项
- 环境未安装Flutter SDK，无法运行 `flutter analyze`，已手动验证代码正确性
- drift import 统一使用 `import 'package:drift/drift.dart' hide Column;`
- uuid 依赖已在 pubspec.yaml 中确认 (uuid: ^4.5.1)
