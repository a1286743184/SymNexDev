# SIP-UI Expert Reference

此文件记录了 SIP-UI Expert Skill 的原始来源与元信息，用于后续更新和同步。

## 源文件路径

| 文件类型 | 路径 |
|---------|------|
| CSS 样式 | `.obsidian/plugins/smart-input-pro/styles.css` |
| 主程序 | `.obsidian/plugins/smart-input-pro/main.js` |
| 配置文件 | `.obsidian/plugins/smart-input-pro/manifest.json` |
| Skill 源文件 | `08-科技树系统/01-OB_LifeOS_Build/04-技能/SIP-UI-Expert.md` |

## 版本信息

| 属性 | 值 |
|------|-----|
| Skill 名称 | SIP-UI Expert |
| 创建日期 | 2026-02-21 |
| 源版本 | Smart Input Pro v2.0.0 |
| 设计系统版本 | v2 (Soft Purple Theme) |

## 设计系统核心特性

### 主题色系 (Soft Purple Theme)
- 主色：`##9f7aea` (柔和紫)
- 悬停色：`#a894fc`
- 表面色：`#f5f3ff` (极浅紫背景)
- 文字强化色：`#8b5cf6`

### 核心组件
1. **Smart Modal** - 悬浮卡片式弹窗
   - 超大圆角 (24px)
   - 高级阴影系统
   - 动画拦截机制

2. **Resource Item** - 资源条目卡片
   - Hover 上浮效果
   - 主题色边框响应

3. **Bordered Group** - 线框表单组
   - 透明背景
   - 淡边框包裹

### 移动端适配法则
- **768px 断点**：网格降维、导航横向化
- **480px 断点**：触控区极限压缩、防挤压策略

## 同步说明

当 `smart-input-pro` 插件更新时，应检查以下内容是否有变化：

1. **styles.css** - 主要样式来源
   - 设计令牌（颜色、间距、圆角）
   - 组件样式（按钮、输入框、弹窗）
   - 响应式断点
   - 动画效果

2. **main.js** - 组件结构参考
   - Modal 类的实现
   - DOM 结构

## 更新命令

如需重新提取样式，可使用：

```powershell
# 查看当前样式文件
Get-Content .obsidian/plugins/smart-input-pro/styles.css
```

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 2.0.0 | 2026-02-21 | 重构为 SIP-UI Expert，引入柔和紫主题、移动端降维法则、进化守则 |
| 1.0.0 | 2026-02-20 | 初始创建，从 smart-input-pro v2.0.0 提取 |

---

## 与 Skill Evolution Manager 协作

此 Skill 设计为与 `Skill Evolution Manager` 协同工作：

### 进化工作流

```
使用 Skill → 收到反馈 → 调用 Evolution Manager → 更新 evolution.json → 缝合到 SKILL.md
```

### 触发进化

- 说 `/evolve`
- 说 "复盘一下刚才的UI设计"
- 说 "把这个经验保存到SIP-UI里"

### evolution.json 结构

```json
{
  "version": 2,
  "created_at": "2026-02-21",
  "updated_at": "2026-02-21",
  "source": "smart-input-pro",
  "skill_name": "SIP-UI Expert",
  "preferences": [
    "用户偏好描述"
  ],
  "fixes": [
    "修复记录"
  ],
  "custom_prompts": "",
  "component_variations": {
    "component_name": "变体描述"
  },
  "mobile_adaptations": [
    "移动端适配经验"
  ],
  "design_token_overrides": {
    "token_name": "覆盖值及原因"
  },
  "notes": [
    "其他备注信息"
  ]
}
```

## 手动导入到 TraeCN

将此文件夹复制到：
```
c:/Users/12867/.trae-cn/skills/sip-ui/
```

或运行：
```powershell
Copy-Item -Recurse -Force "d:\Docements\Obsidian Vault\SymbiNexus\08-科技树系统\01-OB_LifeOS_Build\04-技能\sip-ui" "c:\Users\12867\.trae-cn\skills\"
```
