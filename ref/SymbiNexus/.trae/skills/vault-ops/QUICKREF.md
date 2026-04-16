# Vault-Ops Quick Reference

## 触发词 / Triggers

| 中文 | 英文 | 命令 |
|------|------|------|
| "初始化测试环境" | "Initialize test environment" | `/vault-ops init` |
| "同步插件到测试库" | "Sync plugin to test vault" | `/vault-ops sync` |
| "部署插件到生产库" | "Deploy plugin to production" | `/vault-ops deploy` |
| "回滚插件" | "Rollback plugin" | `/vault-ops rollback` |
| "备份库" | "Backup vault" | `/vault-ops backup` |
| "检查插件版本" | "Check plugin versions" | `/vault-ops status` |

## 常用命令速查

### 初始化
```powershell
# 一键初始化（推荐）
.\.vault-ops\scripts\init-test-env.ps1

# 分步初始化
.\.vault-ops\scripts\sync-to-test.ps1
.\.vault-ops\scripts\mirror-deps.ps1
.\.vault-ops\scripts\mirror-config.ps1
.\.vault-ops\scripts\create-fixtures.ps1
```

### 开发循环
```powershell
# 1. 同步到测试库
.\.vault-ops\scripts\sync-to-test.ps1 -Plugin "smart-input-pro"

# 2. 在测试库验证后部署
.\.vault-ops\scripts\deploy-plugin.ps1 -Plugin "smart-input-pro"
```

### 紧急回滚
```powershell
# 查看可用备份
.\.vault-ops\scripts\rollback.ps1 -Plugin "smart-input-pro" -List

# 回滚到指定版本
.\.vault-ops\scripts\rollback.ps1 -Plugin "smart-input-pro" -Backup "20260222_120000"
```

### 备份
```powershell
# 手动备份生产库
.\.vault-ops\scripts\backup-vault.ps1 -Vault production -Name "backup-name"

# 备份测试库
.\.vault-ops\scripts\backup-vault.ps1 -Vault testing
```

## 脚本参数速查

| 脚本 | 参数 | 说明 |
|------|------|------|
| sync-to-test | `-Plugin <id>` | 指定插件 |
| sync-to-test | `-SkipBackup` | 跳过备份 |
| deploy-plugin | `-Plugin <id>` | 指定插件 |
| deploy-plugin | `-Force` | 跳过确认 |
| deploy-plugin | `-SkipBackup` | 跳过备份 |
| deploy-plugin | `-SkipVersionCheck` | 跳过版本检查 |
| rollback | `-Plugin <id>` | 指定插件（必需） |
| rollback | `-List` | 列出备份 |
| rollback | `-Backup <timestamp>` | 指定备份 |
| backup-vault | `-Vault production\|testing` | 选择库 |
| backup-vault | `-Name <name>` | 自定义名称 |

## 配置文件位置

- **配置**: `.vault-ops\config\plugin-manifest.json`
- **备份**: `.vault-ops\backups\pre-deploy\` (自动)
- **备份**: `.vault-ops\backups\manual\` (手动)
- **变更报告**: `.vault-ops\backups\pre-deploy\*_changes.txt`
- **测试数据**: `test-fixtures\sample-docs\` (可在 Obsidian 中显示)

## 备份保留策略

- 最多保留：**10 个** 备份
- 保留天数：**30 天**
- 自动清理：每次部署/备份时执行
