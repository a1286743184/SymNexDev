# Smart Input Pro

## 更新记录

### 2026-01-24 - v4.0 架构重构（配置驱动）
- 引入 resources/strategy/pipeline/modules 新数据结构，并在启动时自动迁移旧版配置
- 重写设置面板：IDE 风格 Prompt 编辑、多账号/模型/策略配置
- 移除 Prompts 硬编码对象，主流程与各模块处理统一从 settings 读取 Prompt 并运行时插值
