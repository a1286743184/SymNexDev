---
name: vault-ops
description: Manage Obsidian Vault plugin development workflow between production (SymbiNexus) and testing (Testing Vault) vaults. Use this skill when the user wants to sync plugins, deploy to production, rollback, backup vaults, or initialize test environments.
---

# Vault-Ops: Obsidian Vault Development Workflow

This skill provides a complete CI/CD-like workflow for developing and managing Obsidian plugins across two vaults: **Production** (SymbiNexus) and **Testing** (Testing Vault).

## Core Capabilities

1. **Initialize Test Environment**: One-command setup of testing environment with plugins, configs, and sample data
2. **Sync Plugins**: Sync custom plugins from production to testing vault
3. **Mirror Dependencies**: Copy third-party plugins and themes to testing vault
4. **Deploy**: Deploy tested plugins to production with version checking and auto-rollback
5. **Rollback**: Restore plugins from backup with configuration preservation
6. **Backup**: Full vault backups with automatic expiration cleanup
7. **Version Management**: Compare plugin versions and generate change reports

## Usage

**Trigger**: `/vault-ops init` - Initialize test environment
**Trigger**: `/vault-ops sync` - Sync plugins to test vault
**Trigger**: `/vault-ops deploy` - Deploy plugins to production
**Trigger**: `/vault-ops rollback` - Rollback a plugin
**Trigger**: `/vault-ops backup` - Backup a vault
**Trigger**: `/vault-ops status` - Check plugin versions

### Using the Wrapper Script

The skill includes a wrapper script for simplified command execution:

```powershell
# Using wrapper (recommended)
.\.vault-ops\scripts\wrapper.ps1 init --skip-confirm
.\.vault-ops\scripts\wrapper.ps1 sync --plugin smart-input-pro
.\.vault-ops\scripts\wrapper.ps1 deploy --plugin smart-input-pro --force
.\.vault-ops\scripts\wrapper.ps1 rollback --plugin smart-input-pro --list
.\.vault-ops\scripts\wrapper.ps1 backup --vault production --name backup-name
.\.vault-ops\scripts\wrapper.ps1 status
```

## Workflows

### Workflow 1: Initialize Test Environment

**Trigger**: "Initialize my test environment" or `/vault-ops init`

Sets up the complete testing environment:

```powershell
# Using wrapper (recommended)
.\.vault-ops\scripts\wrapper.ps1 init --skip-confirm

# Or direct script
.\.vault-ops\scripts\init-test-env.ps1
```

This executes in sequence:
1. `sync-to-test.ps1` - Sync custom plugins
2. `mirror-deps.ps1` - Mirror dependencies
3. `mirror-config.ps1` - Mirror configurations
4. `create-fixtures.ps1` - Create sample data

### Workflow 2: Development Cycle

**Trigger**: "Sync smart-input-pro to test vault" or `/vault-ops sync -Plugin smart-input-pro`

```powershell
# Using wrapper
.\.vault-ops\scripts\wrapper.ps1 sync --plugin smart-input-pro

# Direct script
.\.vault-ops\scripts\sync-to-test.ps1 -Plugin "smart-input-pro"
```

Then after testing in Testing Vault:

**Trigger**: "Deploy smart-input-pro to production" or `/vault-ops deploy -Plugin smart-input-pro`

```powershell
# Using wrapper
.\.vault-ops\scripts\wrapper.ps1 deploy --plugin smart-input-pro --force

# Direct script with version check (recommended)
.\.vault-ops\scripts\deploy-plugin.ps1 -Plugin "smart-input-pro"
```

### Workflow 3: Rollback

**Trigger**: "Rollback smart-input-pro" or `/vault-ops rollback -Plugin smart-input-pro`

```powershell
# Using wrapper
.\.vault-ops\scripts\wrapper.ps1 rollback --plugin smart-input-pro --list
.\.vault-ops\scripts\wrapper.ps1 rollback --plugin smart-input-pro --backup 20260222_120000

# Direct script
.\.vault-ops\scripts\rollback.ps1 -Plugin "smart-input-pro" -List
```

### Workflow 4: Backup Management

**Trigger**: "Backup production vault" or `/vault-ops backup`

```powershell
# Using wrapper
.\.vault-ops\scripts\wrapper.ps1 backup --vault production --name before-refactor

# Direct script
.\.vault-ops\scripts\backup-vault.ps1 -Vault production -Name "before-refactor"
```

### Workflow 5: Version Status Check

**Trigger**: "Check plugin versions" or `/vault-ops status`

```powershell
# Using wrapper
.\.vault-ops\scripts\wrapper.ps1 status
```

Before deploying, the system automatically:
- Compares versions between test and production vaults
- Shows upgrade/downgrade/same-version status
- Generates change reports (file additions/deletions/modifications)

## Configuration

Edit `.vault-ops\config\plugin-manifest.json`:

```json
{
  "customPlugins": [
    {
      "id": "smart-input-pro",
      "name": "Smart Input Pro",
      "syncMode": "bidirectional",
      "excludeFiles": ["logs/*", "*.backup.json"]
    }
  ],
  "dependencyPlugins": [
    { "id": "dataview", "type": "plugin" }
  ],
  "themes": [
    { "id": "Minimal" }
  ],
  "backup": {
    "retentionDays": 30,
    "maxBackups": 10
  }
}
```

## Scripts Reference

| Script | Function | Common Parameters |
|--------|----------|-------------------|
| `wrapper.ps1` | Unified command entry | `init`, `sync`, `deploy`, `rollback`, `backup`, `status` |
| `init-test-env.ps1` | One-click init | `-SkipConfirm` |
| `sync-to-test.ps1` | Sync custom plugins | `-Plugin`, `-SkipBackup` |
| `mirror-deps.ps1` | Mirror dependencies | `-Type` (plugin/theme/all) |
| `mirror-config.ps1` | Mirror configs | `-Files` |
| `create-fixtures.ps1` | Create test data | `-Force` |
| `backup-vault.ps1` | Backup vault | `-Vault`, `-Type`, `-Name` |
| `deploy-plugin.ps1` | Deploy to production | `-Plugin`, `-Force`, `-SkipBackup`, `-SkipVersionCheck` |
| `rollback.ps1` | Rollback plugin | `-Plugin`, `-Backup`, `-List` |
| `utils.ps1` | Shared functions | (internal use) |

## Key Features

### 1. Version Management
- Automatic version comparison before deployment
- Semantic version parsing (major.minor.patch)
- Warns on same-version or downgrade
- Change reports saved with backups

### 2. Safety Features
- Auto-backup before deploy/rollback
- User config preservation (data.json)
- Auto-rollback on validation failure
- Backup expiration cleanup (30 days / 10 backups)

### 3. Validation
- manifest.json existence check
- Required fields validation (id, version, name)
- Plugin ID matching
- Automatic rollback on failure

## Directory Structure

```
.vault-ops/
├── config/
│   └── plugin-manifest.json
├── scripts/
│   ├── wrapper.ps1            # Unified command entry
│   ├── init-test-env.ps1      # One-click init
│   ├── utils.ps1              # Shared functions
│   ├── sync-to-test.ps1
│   ├── mirror-deps.ps1
│   ├── mirror-config.ps1
│   ├── create-fixtures.ps1
│   ├── backup-vault.ps1
│   ├── deploy-plugin.ps1
│   └── rollback.ps1
└── backups/
    ├── pre-deploy/            # Auto-backups
    └── manual/                # Manual backups
```

## Common Commands

```powershell
# Quick start - initialize everything
.\.vault-ops\scripts\wrapper.ps1 init --skip-confirm

# Sync and deploy single plugin
.\.vault-ops\scripts\wrapper.ps1 sync --plugin smart-input-pro
# ... test in Testing Vault ...
.\.vault-ops\scripts\wrapper.ps1 deploy --plugin smart-input-pro

# Emergency rollback
.\.vault-ops\scripts\wrapper.ps1 rollback --plugin smart-input-pro --list
.\.vault-ops\scripts\wrapper.ps1 rollback --plugin smart-input-pro --backup 20260222_120000

# Check version status
.\.vault-ops\scripts\wrapper.ps1 status
```

## Troubleshooting

**Problem**: "Plugin not found in test vault"
- Run `sync-to-test.ps1` first

**Problem**: "Version check warning"
- This means test vault has same or older version than production
- Use `-SkipVersionCheck` to force deploy

**Problem**: "Deployment failed validation"
- Auto-rollback should have triggered
- Check `backups\pre-deploy\` for the backup
- Manual rollback with `rollback.ps1 -List`

**Problem**: "Backup folder too large"
- Backups auto-cleanup after 30 days or 10 backups per plugin
- Manually clean `backups\pre-deploy\` if needed
