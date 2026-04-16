# Ruflo 官方文档调研报告

**调研日期**: 2026-03-25
**信息来源**: GitHub (ruvnet/claude-flow), 官方文档站点, v3alpha 版本文档

---

## 一、项目概述

Ruflo（也称 Claude Flow）是一个多智能体蜂群协作框架，CLI 调用方式为 `npx ruflo@latest`。

**官方资源**:
- 仓库: https://github.com/ruvnet/claude-flow
- 文档: https://claude-flow.ruv.io/
- NPM: `claude-flow` / `ruflo`

---

## 二、CLI 命令体系（26个核心命令）

### 2.1 命令分类总览

| 类别 | 命令数 | 主要功能 |
|------|--------|----------|
| `init` | 1 | 项目初始化 |
| `agent` | 8 | 智能体生命周期管理 |
| `swarm` | 6 | 蜂群协调 |
| `memory` | 12 | 记忆存储与检索 |
| `task` | 6 | 任务管理 |
| `session` | 7 | 会话管理 |
| `hooks` | 17+ | 自学习钩子 |
| `hive-mind` | 6 | 皇后主导蜂群 |
| `mcp` | 9 | MCP服务器管理 |
| `worker` | 12 | 后台工作器（通过hooks调用） |
| `embeddings` | 13 | 向量嵌入 |
| `ruvector` | - | PostgreSQL向量库 |

### 2.2 核心命令速查

```bash
# 初始化
npx ruflo@latest init --wizard          # 向导模式
npx ruflo@latest init --full           # 完整安装(含MCP)

# 智能体
npx ruflo@latest agent spawn --type coder --name my-coder
npx ruflo@latest agent pool --status
npx ruflo@latest agent health --id <agent-id>

# 蜂群
npx ruflo@latest swarm init --topology hierarchical --max-agents 8
npx ruflo@latest swarm start --task "构建API" --agents 8 --parallel
npx ruflo@latest swarm status
npx ruflo@latest swarm scale --agents 12

# 记忆
npx ruflo@latest memory store --key "pattern-auth" --value "JWT" --namespace patterns
npx ruflo@latest memory search --query "认证模式"
npx ruflo@latest memory stats

# Hive-Mind
npx ruflo@latest hive-mind init
npx ruflo@latest hive-mind spawn "构建API" --queen-type strategic --consensus byzantine

# MCP服务
npx ruflo@latest mcp start
npx ruflo@latest mcp start --transport http --port 3000
npx ruflo@latest mcp tools

# 后台工作器（通过hooks调用）
npx ruflo@latest hooks worker dispatch --trigger audit --context "./src"
npx ruflo@latest hooks worker dispatch --trigger deepdive --context "./src"
```

### 2.3 重要参数

| 参数 | 适用命令 | 说明 |
|------|----------|------|
| `--topology` | swarm, hive-mind | 网络拓扑: hierarchical, mesh, ring, star, hybrid |
| `--max-agents` | swarm | 最大智能体数(默认8) |
| `--strategy` | swarm | 策略: specialized, balanced, adaptive |
| `--namespace` | memory | 内存命名空间隔离 |
| `--consensus` | hive-mind | 共识协议: raft, byzantine, quorum |
| `--trigger` | hooks worker | 触发器类型 |

---

## 三、最佳实践

### 3.1 蜂群拓扑选择

| 拓扑 | 适用场景 | 特点 |
|------|----------|------|
| `hierarchical` | 编码任务 | 皇后/工作器模式，单一协调者强制对齐 |
| `mesh` | 分布式协调 | 点对点模式 |
| `ring` | 替代方案 | 顺序协调 |
| `star` | 替代方案 | 中心化轮毂模式 |

**推荐编码任务配置**:
```javascript
swarm_init({
  topology: "hierarchical",
  maxAgents: 8,
  strategy: "specialized"
})
```

### 3.2 反漂移最佳实践

- 使用 hierarchical 拓扑进行编码任务
- 保持 maxAgents 在 6-8 之间以确保紧密协调
- 使用 `raft` 共识(hive-mind)
- 通过 post-task hooks 频繁检查点
- 所有 agents 共享内存命名空间
- 短任务周期配合验证门

### 3.3 任务复杂度分级（ADR-026 3层模型）

| 层级 | 处理器 | 延迟 | 成本 | 适用场景 |
|------|--------|------|------|----------|
| 1 | Agent Booster (WASM) | <1ms | $0 | 简单转换(var→const, 添加类型) |
| 2 | Haiku | ~500ms | $0.0002 | 简单任务，<30%复杂度 |
| 3 | Sonnet/Opus | 2-5s | $0.003-0.015 | 复杂推理，>30%复杂度 |

### 3.4 任务-智能体路由

| 任务类型 | 推荐智能体组合 |
|----------|---------------|
| Bug修复 | coordinator, researcher, coder, tester |
| 功能开发 | coordinator, architect, coder, tester, reviewer |
| 重构 | coordinator, architect, coder, reviewer |
| 性能优化 | coordinator, perf-engineer, coder |
| 安全审计 | coordinator, security-architect, auditor |
| 记忆优化 | coordinator, memory-specialist, perf-engineer |

---

## 四、架构与集成

### 4.1 系统架构

```
用户 → CLI/MCP Server → 路由器 → 蜂群 → 智能体 → 记忆 → LLM提供商
```

**四层架构**:

| 层级 | 组件 |
|------|------|
| 入口层 | CLI / MCP Server + AIDefence安全 |
| 路由层 | Q-Learning路由器, MoE(8专家), 42+技能, 17钩子 |
| 蜂群协调层 | mesh/hierarchical/ring/star拓扑, Raft/BFT/Gossip/CRDT共识 |
| 智能层(RuVector) | SONA, EWC++, Flash Attention, HNSW, LoRA压缩, 9种RL算法 |

### 4.2 MCP集成

**快速启动**:
```bash
npx ruflo@v3alpha mcp start
```

**Claude Code集成**:
```bash
claude mcp add ruflo -- npx ruflo@v3alpha mcp start
```

**Claude Desktop集成** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "ruflo": {
      "command": "npx",
      "args": ["ruflo@v3alpha", "mcp", "start"],
      "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
    }
  }
}
```

### 4.3 MCP工具（31+工具，7大类）

| 类别 | 工具 | 用途 |
|------|------|------|
| 协调 | swarm_init, agent_spawn, task_orchestrate | 蜂群和智能体生命周期 |
| 监控 | swarm_status, agent_list, agent_metrics | 实时状态 |
| 记忆 | memory_usage, neural_status, neural_train | 记忆操作 |
| GitHub | github_swarm, repo_analyze, pr_enhance | 仓库集成 |
| 工作器 | worker/run, worker/status, worker/alerts | 后台任务 |
| 钩子 | hooks/pre-*, hooks/post-*, hooks/route | 生命周期事件 |
| 进度 | progress/check, progress/sync, progress/summary | 实现跟踪 |

### 4.4 记忆架构

**HNSW向量搜索**: 子毫秒级检索，比基线快150x

**三层记忆 (HierarchicalMemory)**:
| 层级 | 用途 |
|------|------|
| Working | 短期即时操作 |
| Episodic | 基于会话的经验 |
| Semantic | 长期知识存储 |

**嵌入**: ONNX Runtime + MiniLM 本地向量，比API调用快75x

### 4.5 RuVector智能组件

| 组件 | 功能 |
|------|------|
| SONA | 自优化神经架构 (<0.05ms适应) |
| EWC++ | 弹性权重巩固 - 防止灾难性遗忘 |
| Flash Attention | 大文档处理加速 2.49x-7.47x |
| HNSW | 向量检索加速 150x-12,500x |
| LoRA | 超轻量级适配器压缩 |

---

## 五、性能优化

### 5.1 Agent Booster (WASM)

| 指标 | Agent Booster | LLM调用 |
|------|---------------|---------|
| 延迟 | <1ms | 2-5s |
| 成本 | $0 | $0.0002-$0.015 |
| 加速比 | **352x更快** | 基线 |

**WASM处理**: var-to-const, add-types, add-error-handling, async-await, add-logging, remove-console

### 5.2 Token优化器

实现30-50% token reduction:
- ReasoningBank检索 (-32%)
- Agent Booster编辑 (-15%)
- 缓存 (-10%)
- 最佳批大小 (-20%)

### 5.3 性能指标

- SWE-Bench解决率: 84.8%
- 蜂群编排加速: 2.8-4.4x
- 3层路由节省API成本: 75%

---

## 六、安全加固

### 6.1 威胁向量

- 提示注入（覆盖智能体指令）
- 记忆投毒（写入虚假数据）
- 共谋（智能体协调绕过安全措施）
- 权限提升（请求未授权能力）
- 数据泄露（通过工具提取敏感数据）

### 6.2 防御模块

| 模块 | 功能 |
|------|------|
| ThreatDetector | 扫描输入和记忆写入的攻击模式 |
| CollusionDetector | 跟踪智能体间交互，识别环形拓扑 |
| MemoryQuorum | 关键记忆写入需67%阈值同意 |
| MemoryWriteGate | 强制每个智能体命名空间权限和速率限制 |
| TrustSystem | 动态调整权限(trusted/probation/untrusted层) |
| AuthorityGate | 高风险操作需要人工批准 |

### 6.3 防御链

```
输入 → ThreatDetector → TrustSystem → AuthorityGate → MemoryQuorum → MemoryWriteGate
```

### 6.4 安全敏感操作配置

- 启用 AuthorityGate 用于生产部署
- 使用 MemoryQuorum 配合67%阈值
- 启用 CollusionDetector
- 实现 TrustSystem 分层

---

## 七、后台工作器（12触发器）

| Worker | Trigger | 用途 |
|--------|---------|------|
| UltraLearn | ultralearn | 深度知识获取 |
| Optimize | optimize | 性能优化建议 |
| Consolidate | consolidate | 记忆整合 |
| Predict | predict | 预测预加载 |
| Audit | audit | 安全漏洞分析 |
| Map | map | 代码库结构映射 |
| Preload | preload | 资源预加载 |
| DeepDive | deepdive | 深度代码分析 |
| Document | document | 自动文档生成 |
| Refactor | refactor | 重构建议 |
| Benchmark | benchmark | 性能基准测试 |
| TestGaps | testgaps | 测试覆盖率分析 |

**调用方式**: `npx ruflo@latest hooks worker dispatch --trigger <trigger> --context <path>`

---

## 八、常见工作流

### 8.1 多智能体开发蜂群

```bash
# 启动 hierarchical swarm 进行功能开发
npx ruflo@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
npx ruflo@latest swarm start --task "构建REST API" --agents 8 --parallel

# 监控进度
npx ruflo@latest swarm status
npx ruflo@latest swarm scale --agents 12
```

### 8.2 记忆模式存储和检索

```bash
# 存储认证模式
npx ruflo@latest memory store --key "pattern-auth" --value "JWT with refresh" --namespace patterns --ttl 86400

# 搜索模式
npx ruflo@latest memory search --query "authentication patterns" --namespace patterns
```

### 8.3 后台工作器处理

```bash
# 后台运行安全审计
npx ruflo@latest hooks worker dispatch --trigger audit --context "./src" --priority high

# 深度代码分析
npx ruflo@latest hooks worker dispatch --trigger deepdive --context "./src/complex-module"

# 测试覆盖率分析
npx ruflo@latest hooks worker dispatch --trigger testgaps --context "./src"
```

---

## 九、注意事项

1. **版本**: 使用 `npx ruflo@latest` 稳定版，`npx ruflo@v3alpha` 获取alpha特性
2. **MCP服务器**: Claude Code集成前必须先运行 `npx ruflo@latest mcp start`
3. **HNSW搜索**: 记忆搜索使用HNSW索引，比基线快150x-12,500x
4. **层级拓扑**: 推荐用于编码蜂群
5. **守护进程**: 使用 `npx ruflo@latest daemon start` 运行后台工作器
6. **插件安装**: 通过npm安装，必须显式启用
7. **Worker命令**: 后台工作器通过 `hooks worker` 调用，不是独立命令

---

**报告生成**: 蜂群协同调研 (3个并行研究智能体)
**调研耗时**: ~7分钟
