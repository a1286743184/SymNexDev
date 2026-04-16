Smart Input Pro（Obsidian 插件）

概述
- 为日常快速记录与整理而设计的智能录入插件。提供统一录入入口（文本/语音），自动进行语义优化与功能分类，并分流到既定模块（记账、任务、备忘、联系人、美食待尝清单、杂项，及可选的题目复盘/刷题记录）。录入成功后可自动打开并定位到新增内容，帮助你无缝地从“记录”过渡到“跟进”。

为什么这版重构
- 提升启动性能：移除启动期“全库扫描”，改为按需惰性解析（首次使用记账功能时才解析模板路径）。
- 稳定性增强：修复“Cannot access SmartInputProPlugin before initialization”错误，相关辅助方法（Token 记录）迁入类内部。
- 可观测性完善：新增 Token 消耗记录的设置与保存路径，支持按阶段统计。

快速开始
- 在命令面板执行“Smart Input Pro: SmartInput”（或绑定你的快捷键）。
- 在弹出的 SmartInput 录入界面中输入文本或使用语音录入（支持倒计时自动提交）。
- 提交后执行两阶段：
  - Stage1（语义优化与分类）：清理口语冗余、纠正识别错误、识别分类（bill/task/memo/contact/food_wishlist/other/…）。
  - Stage2（分流与落盘）：按分类写入到目标模块，支持模板、目录结构解析、自动创建缺失目录/文件，并导航定位。

核心能力
- 统一入口与轻量 UI：单一入口命令，简洁录入体验。
- 语义优化与分类（Stage1）：
  - 口语清理与纠错，保持自然口语风格。
  - 语义分类：bill/task/memo/contact/food_wishlist/other（可扩展 question_review、study_record）。
- 分流落盘（Stage2）：
  - 记账 bill：基于“记账模板”写入结构化记录，按年/月创建目录；支持自动定位到新记录位置。
  - 任务 task：写入周委托列表（Weekly List），支持定位末尾导航。
  - 备忘 memo：写入 INBOX 或 Weekly List，定位到写入位置。
  - 联系人 contact：解析姓名与手机号，更新或创建角色档案，并打开定位到该档案。
  - 美食待尝清单 food_wishlist：以清单项形式写入并定位到新条目。
  - 杂项 other：归入 INBOX，用于轻量信息捕获。
- 导航与定位：录入成功后自动打开目标文档，并定位到新增内容或末尾位置。

配置常量（Config，位于 main.js 顶部）
- ERROR_LOG: .obsidian/plugins/smart-input-pro/ai_error_logs.jsonl
- API_KEY_PATH: 06-财务系统/00-系统配置/密钥/GLM4_API_KEY.md
- CAPTURE_INBOX_PATH: 01-经纬矩阵系统/08-智能录入模块/01-INBOX.md
- BILL_BASE_PATH: 06-财务系统/01-账单数据
- TEMPLATE_PATH: 04-模板系统/09-专用模板/记账模板.md
- BILL_TEMPLATE_BASENAME: 记账模板
- ROLE_TEMPLATE_PATH: 04-模板系统/03-生活坐标模板/角色档案/角色档案.md
- ROLE_BASE_PATH: 05-生活坐标系统/01-角色档案
- FOOD_WISHLIST_PATH: 05-生活坐标系统/04-美食档案/待尝清单.md
- WEEKLY_DELEGATION_PREFIX: 01-经纬矩阵系统/02-周委托模块/周度委托列表
- TOKEN_COST_PATH（推荐在设置中管理）: 01-经纬矩阵系统/08-智能录入模块/03-智能录入日志.md

插件设置（Settings）
- apiKey / apiKeyPath：智谱 GLM4 API 密钥或密钥文档路径。
- templatePath：记账模板优先路径（可覆盖 Config.TEMPLATE_PATH）。
- capturePath：INBOX 捕获路径（可覆盖 Config.CAPTURE_INBOX_PATH）。
- billPath：账单数据根目录（用于构造年/月目录）。
- autoClassify：是否在录入后自动进行语义分类（如存在）。
- enableTokenCostTracking：是否记录 Token 消耗（默认开启）。
- tokenCostFilePath：Token 消耗记录的保存路径（默认 01-经纬矩阵系统/08-智能录入模块/03-智能录入日志.md）。

性能与加载时间优化
- 启动阶段轻量化：
  - loadSettings 仅做存在性与规范化检查，不再扫描全库。
  - 不在 onload 中执行遍历/扫描，仅注册命令、状态栏与设置页。
- 惰性解析模板路径：
  - 新增 ensureTemplatePathReady()，仅在首次使用记账功能时解析模板路径（必要时才进行全库扫描）。
  - 解析成功后会写回设置，后续复用，不再重复扫描。
- 使用建议：
  - 如你已知模板路径，直接在设置中填写，以完全避免扫描。
  - 若库较大，首次使用记账功能时可能出现一次解析延迟，属于预期行为。

工作流程（开发者视角）
- Entry：SmartInput（UI/入口），module.exports
- Stage1：
  - semanticClassifyAndOptimize：清理与分类
  - callZhipuJSON：与 GLM4 交互（支持 trackStage 与 Token 累加）
  - classifyAndSave：分类结果写入与流转（受 enableTokenCostTracking 开关保护）
- Stage2：
  - processCategoryBill / Task / Memo / Contact / FoodWishlist / Other
  - processCategoryBill 中调用 ensureTemplatePathReady，确保仅在需要时解析模板
- Helpers：路径解析、模板加载、文件写入、日志与导航

日志与排查
- 运行日志：.obsidian/plugins/smart-input-pro/ai_pipeline_logs.jsonl（分步事件记录）。
- 错误日志：.obsidian/plugins/smart-input-pro/ai_error_logs.jsonl（错误与成功事件摘要）。
- 导航失败排查：
  - 确认库中存在目标路径（如 ROLE_BASE_PATH、FOOD_WISHLIST_PATH）。
  - 检查 NavigationHelper 初始化（this.navigationHelper = new NavigationHelper(this.app)）。
- 模板未找到：
  - 优先在设置中指定 templatePath；或在 04-模板系统/09-专用模板/ 中创建“记账模板.md”。
  - 若依赖惰性解析，首次使用记账功能时将自动尝试解析（必要时扫描）。
- Token 记录未写入：
  - 确认已开启 enableTokenCostTracking。
  - 检查 tokenCostFilePath 指向有效文档。

常见问题（FAQ）
- 联系人录入后未自动打开：新版已在更新/新建后导航；如未生效，请确认 NavigationHelper 与路径配置。
- 模板缺失或路径错误：设置中修正 templatePath；或确保模板存在于 04-模板系统/09-专用模板/。
- 启动变慢：已移除启动期全库扫描；若仍感觉缓慢，请检查是否有其他插件在 onload 中执行遍历。

变更记录（摘要）
- 2025-10-11：启动性能优化 & Token 消耗记录设置
  - 移除 loadSettings 中的全库扫描，新增 ensureTemplatePathReady（惰性解析）。
  - 新增 enableTokenCostTracking 与 tokenCostFilePath 设置；Token 记录辅助方法迁入类内部。
  - 修复初始化前引用错误，提升稳定性。
- 2025-10-10：功能重构与新增
  - 刷题复盘更名为刷题记录：study_review → study_record；相关函数与路径常量重命名。
  - 新增题目复盘功能：question_review 分类与 processCategoryQuestionReview，支持按题目类型目录存储，文件命名规则为“板块字段-题目标志.md”。
  - 调整功能编号：题目复盘插入为第5项；其余功能编号顺延。

附注
- 若你的库结构不同，可在 Config 或插件设置中调整路径常量以适配。
- 本文档从整体出发，聚焦于用户可用性与开发者维护性；如需更详细的实现细节，请在 main.js 中查看对应分组（Helpers/Stage1/Stage2/Entry）。
