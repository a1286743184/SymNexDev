# TaskReorderModule 开发经验总结

## 概述

TaskReorderModule 是一个为 Obsidian 开发的任务重排模块，能够在各种视图模式下自动重排任务列表，按照优先级和日期规则重新组织任务项。本文档总结了该模块的实现方式以及攻克视图切换难关的经验。

## 功能特点

1. **多视图兼容**：支持在编辑视图、实时预览和阅读视图下运行
2. **智能任务识别**：识别各种格式的任务标记（- [ ]、- [x]、* [ ]等）
3. **时间排序**：按照完成状态和日期规则重排任务
  - 已完成任务：有完成日期的按最新完成优先，有截止日期的按最近截止优先，无日期的保持原顺序
  - 未完成任务：有截止日期的按最近截止优先，无日期的保持原顺序
  - 同一层级内，已完成任务排在未完成任务之前
4. **日志记录**：详细的运行日志，便于问题排查
5. **视图切换**：自动处理阅读模式下的编辑需求
6. **编辑器获取**：多层次编辑器获取策略，确保在各种环境下都能工作

## 实现架构

### 核心组件

1. **Logger 对象**：负责日志记录和管理
2. **视图检测模块**：识别当前视图状态
3. **任务处理模块**：解析和重排任务
4. **视图切换模块**：处理不同视图间的切换
5. **编辑器获取模块**：多层次获取编辑器对象

### 关键代码结构

```javascript
// 日志记录器
const Logger = {
    init: async function() { /* 初始化日志 */ },
    log: function(message) { /* 记录日志 */ },
    finish: async function() { /* 完成日志记录 */ }
};

// 视图状态检测
function getCurrentViewMode() {
    // 获取当前视图模式
}

// 主执行函数
module.exports = async (params, context) => {
    // 初始化环境
    // 检测视图状态
    // 处理视图切换（仅阅读视图）
    // 获取编辑器
    // 处理任务重排
    // 恢复视图状态（如需要）
};
```

## 攻克视图切换难关的经验

### 问题背景

在开发过程中，遇到的主要挑战是在不同视图模式下执行任务重排。Obsidian 有三种视图模式：
1. **阅读视图**：只读模式，无法直接编辑内容
2. **实时预览视图**：可编辑的预览模式
3. **源码视图**：纯Markdown编辑模式

最初的问题是在阅读视图下无法执行重排操作，需要切换到编辑视图。后续发现实时预览视图也存在编辑器获取困难的问题。

### 解决方案演进

### 视图切换解决方案演进

1. **初始方案**：直接切换到源码视图，不考虑当前视图状态
   - 问题：在源码视图下也会执行切换，导致不必要的操作

2. **改进方案**：检测当前视图状态，仅在阅读视图下切换
   - 问题：视图状态检测不准确，特别是在实时预览视图下

3. **精确视图状态处理**：精确检测视图状态，区分阅读视图、实时预览和源码视图
   - 解决方案：通过检查 view.getState().mode 和 view.getState().source 属性
   - 结果：仅在阅读视图下执行切换，其他视图直接操作

4. **多层次编辑器获取策略**：针对不同视图模式提供多种编辑器获取方式
   - 解决方案：从 activeView.editor 开始，逐步尝试 activeEditor、quickAddApi、遍历叶子节点等多种方式
   - 结果：在大多数视图模式下都能成功获取编辑器

5. **实时预览视图特殊处理**：针对实时预览视图的特殊处理
   - 解决方案：尝试通过 sourceMode、editMode 等特殊属性获取编辑器，甚至检查 activeView 的内部结构
   - 结果：解决了实时预览视图下编辑器获取困难的问题

6. **容错机制增强**：增加备用检测方法，提高兼容性
   - 解决方案：在主要检测方法失败时，通过检查编辑器是否存在来判断视图状态
   - 结果：在各种环境下都能正确识别视图状态

7. **错误处理和用户提示**：增加完善的错误处理机制
   - 解决方案：在视图切换失败时提供友好的错误提示，而不是静默失败
   - 结果：用户体验更好，问题更容易排查

### 关键经验总结

1. **精确视图识别**：必须准确区分"阅读视图"、"实时预览"和"源码视图"三种模式，通过检查 state.mode 和 state.source 属性进行精确判断
2. **模块加载容错**：提供多种方式获取 obsidian 模块（require、window.obsidian、context.app.constructor），确保在不同环境下都能工作
3. **条件性视图切换**：仅在阅读视图下执行切换，避免不必要的操作，实时预览视图和源码视图都是可以直接编辑的
4. **多层次编辑器获取**：针对不同视图模式提供多种编辑器获取方式，特别是针对实时预览视图的特殊处理
5. **实时预览视图特殊处理**：实时预览视图需要通过 sourceMode、editMode 等特殊属性获取编辑器，甚至需要检查 activeView 的内部结构
6. **详细日志记录**：记录关键步骤和状态，便于问题排查，包括视图状态检测、编辑器获取等关键步骤
7. **渐进式增强**：从简单到复杂，逐步完善解决方案，包括备用检测方法和多种编辑器获取策略
8. **错误处理和容错机制**：在视图状态检测失败时提供备用检测方法，在视图切换失败时提供友好的错误提示

## 技术要点

### 1. 视图状态检测

```javascript
try {
  // 尝试多种方式获取 obsidian 模块
  let obsidianModule;
  try {
    obsidianModule = require('obsidian');
    Logger.log("通过 require('obsidian') 获取模块成功");
  } catch (e) {
    // 尝试通过全局变量获取
    obsidianModule = (typeof window !== 'undefined' && window.obsidian) ? window.obsidian : null;
    Logger.log(`通过 window.obsidian 获取模块${obsidianModule ? '成功' : '失败'}`);
  }
  
  if (!obsidianModule) {
    // 如果仍然无法获取，尝试通过 QuickAdd 的 context 获取
    obsidianModule = (context && context.app && context.app.constructor) ? context.app.constructor : null;
    Logger.log(`通过 context.app.constructor 获取模块${obsidianModule ? '成功' : '失败'}`);
  }
  
  if (!obsidianModule) {
    throw new Error("无法获取 obsidian 模块");
  }
  
  const view = obsApp.workspace.getActiveViewOfType(obsidianModule.MarkdownView);
  if (!view) {
    // 如果不是 Markdown 视图，我们无法获取状态，但通常会有 editor
    originalViewMode = 'source'; // 假定为可编辑状态
    Logger.log("无法获取 MarkdownView，假定为源码视图");
  } else {
    const state = view.getState();
    Logger.log(`视图状态: mode=${state.mode}, source=${state.source}`);
    
    if (state.mode === 'preview') {
      originalViewMode = 'reading'; // 明确是阅读视图
      Logger.log("检测到阅读视图");
    } else if (state.mode === 'source') {
      if (state.source === false) {
        originalViewMode = 'live'; // 明确是实时预览
        Logger.log("检测到实时预览视图");
      } else {
        originalViewMode = 'source'; // 明确是源码视图
        Logger.log("检测到源码视图");
      }
    } else {
      originalViewMode = 'source'; // 未知状态，保险起见假定为可编辑
      Logger.log("未知视图状态，假定为源码视图");
    }
  }
} catch (e) {
  // 如果上述方法失败，尝试通过其他方式检测视图状态
  Logger.log(`视图状态检测出错: ${e.message}`);
  originalViewMode = 'source'; // 出错时，假定为可编辑，避免错误切换
  
  // 尝试通过检查编辑器是否存在来判断是否在预览模式
  try {
    const activeView = obsApp?.workspace?.getActiveView?.();
    const hasEditor = !!(activeView?.editor);
    Logger.log(`备用检测: hasEditor=${hasEditor}`);
    
    // 如果没有编辑器，可能处于阅读视图
    if (!hasEditor) {
      originalViewMode = 'reading';
      Logger.log("备用检测: 判定为阅读视图");
    }
  } catch (e2) {
    // 备用检测也失败，保持默认值
    Logger.log(`备用检测也失败: ${e2.message}`);
  }
}
```

### 2. 视图切换控制

```javascript
const needsSwitching = originalViewMode === 'reading';
Logger.log(`需要切换视图: ${needsSwitching} (原始视图: ${originalViewMode})`);

// 只有在【阅读视图】时，才需要切换到源码视图
// 实时预览视图(live)和源码视图(source)都是可以直接编辑的
if (needsSwitching) {
  try {
    Logger.log("尝试从阅读视图切换到编辑视图");
    await obsApp.commands.executeCommandById('markdown:toggle-preview');
    // 等待切换完成
    await new Promise(resolve => setTimeout(resolve, 200)); // 缩短等待时间
    Logger.log("视图切换完成");
  } catch (e) {
    Logger.log(`视图切换失败: ${e.message}`);
    notify("[TaskReorder] 无法自动切换到编辑模式，请手动切换后重试。");
    return; // 切换失败则中止
  }
}
```

### 3. 任务重排算法

```javascript
// 已完成任务排序：有完成日期降序 > 有截止日期升序 > 无日期
completed.sort((a, b) => {
    const aHasDone = a.key.doneTime != null;
    const bHasDone = b.key.doneTime != null;
    if (aHasDone && bHasDone) {
        // 完成日期降序（最近完成靠前）
        if (b.key.doneTime !== a.key.doneTime) return b.key.doneTime - a.key.doneTime;
    } else if (aHasDone || bHasDone) {
        return aHasDone ? -1 : 1; // 有完成日期的在前
    } else {
        // 无完成日期，比较截止日期（升序）
        const aHasDue = a.key.dueTime != null;
        const bHasDue = b.key.dueTime != null;
        if (aHasDue && bHasDue) {
            if (a.key.dueTime !== b.key.dueTime) return a.key.dueTime - b.key.dueTime;
        } else if (aHasDue || bHasDue) {
            return aHasDue ? -1 : 1; // 有截止日期的在前
        }
    }
    // 保持原相对顺序
    return a.key.originalIndex - b.key.originalIndex;
});

// 未完成排序：有截止日期升序 > 无日期
pending.sort((a, b) => {
    const aHasDue = a.key.dueTime != null;
    const bHasDue = b.key.dueTime != null;
    if (aHasDue && bHasDue) {
        if (a.key.dueTime !== b.key.dueTime) return a.key.dueTime - b.key.dueTime; // 近期优先
    } else if (aHasDue || bHasDue) {
        return aHasDue ? -1 : 1; // 有截止日期的在前
    }
    return a.key.originalIndex - b.key.originalIndex; // 保持原相对顺序
});
```

### 4. 多层次编辑器获取策略

```javascript
// 1) 首先尝试通过 activeView 获取编辑器（适用于实时预览视图和源码视图）
const activeView = obsApp?.workspace?.getActiveView?.();
if (activeView?.editor) {
  editor = activeView.editor;
  Logger.log("通过 activeView.editor 获取编辑器成功");
}

// 2) 回退：activeEditor（部分场景可用）
if (!editor && obsApp?.workspace?.activeEditor?.editor) {
  editor = obsApp.workspace.activeEditor.editor;
  Logger.log("通过 workspace.activeEditor.editor 获取编辑器成功");
}

// 3) 回退：QuickAdd 暴露的编辑器
if (!editor && quickAddApi?.editor) {
  editor = quickAddApi.editor;
  Logger.log("通过 quickAddApi.editor 获取编辑器成功");
}

// 4) 进一步回退：在所有叶子中寻找含有 editor 且带 file 的 markdown 视图
if (!editor && obsApp?.workspace?.getLeaves) {
  const leaves = obsApp.workspace.getLeaves();
  const mdLeaf = leaves.find(l => {
    const v = l?.view;
    return v && typeof v.getViewType === 'function' && v.getViewType() === 'markdown' && v.file && v.editor;
  });
  if (mdLeaf) {
    editor = mdLeaf.view.editor;
    Logger.log("通过遍历 leaves 获取编辑器成功");
  }
}

// 5) 对于实时预览视图，尝试通过不同的方式获取编辑器
if (!editor && originalViewMode === 'live') {
  Logger.log("在实时预览视图中尝试特殊方式获取编辑器");
  
  // 尝试通过 MarkdownView 的 editor 属性获取
  const markdownView = obsApp.workspace.getActiveViewOfType(obsidianModule.MarkdownView);
  if (markdownView?.editor) {
    editor = markdownView.editor;
    Logger.log("在实时预览视图中通过 MarkdownView.editor 获取编辑器成功");
  }
  
  // 尝试通过 view.editor 获取
  if (!editor && activeView?.editor) {
    editor = activeView.editor;
    Logger.log("在实时预览视图中通过 activeView.editor 获取编辑器成功");
  }
  
  // 尝试通过 view.sourceMode 获取编辑器（实时预览特有）
  if (!editor && activeView?.sourceMode?.editor) {
    editor = activeView.sourceMode.editor;
    Logger.log("在实时预览视图中通过 activeView.sourceMode.editor 获取编辑器成功");
  }
  
  // 尝试通过 view.editMode 获取编辑器（实时预览特有）
  if (!editor && activeView?.editMode?.editor) {
    editor = activeView.editMode.editor;
    Logger.log("在实时预览视图中通过 activeView.editMode.editor 获取编辑器成功");
  }
  
  // 尝试通过 leaf.view.editor 获取
  if (!editor) {
    const leaf = obsApp.workspace.getActiveViewOfType(obsidianModule.MarkdownView)?.leaf;
    if (leaf?.view?.editor) {
      editor = leaf.view.editor;
      Logger.log("在实时预览视图中通过 leaf.view.editor 获取编辑器成功");
    }
  }
  
  // 尝试通过 workspace.leaf 获取编辑器
  if (!editor) {
    const leaf = obsApp.workspace.getLeaf();
    if (leaf?.view?.editor) {
      editor = leaf.view.editor;
      Logger.log("在实时预览视图中通过 workspace.leaf.view.editor 获取编辑器成功");
    }
  }
  
  // 尝试通过 workspace.activeLeaf 获取编辑器
  if (!editor) {
    const leaf = obsApp.workspace.activeLeaf;
    if (leaf?.view?.editor) {
      editor = leaf.view.editor;
      Logger.log("在实时预览视图中通过 workspace.activeLeaf.view.editor 获取编辑器成功");
    }
  }
  
  // 尝试通过检查 activeView 的内部结构获取编辑器
  if (!editor && activeView) {
    Logger.log("检查 activeView 的内部结构");
    try {
      // 打印 activeView 的结构（仅用于调试）
      const viewKeys = Object.keys(activeView);
      Logger.log(`activeView 的属性: ${viewKeys.join(', ')}`);
      
      // 尝试通过可能的属性获取编辑器
      for (const key of viewKeys) {
        if (key.includes('editor') || key.includes('Editor')) {
          const potentialEditor = activeView[key];
          if (potentialEditor && typeof potentialEditor.getValue === 'function') {
            editor = potentialEditor;
            Logger.log(`在实时预览视图中通过 activeView.${key} 获取编辑器成功`);
            break;
          }
        }
      }
    } catch (e) {
      Logger.log(`检查 activeView 内部结构失败: ${e.message}`);
    }
  }
}
```

## 使用方法

1. 将 TaskReorderModule.js 放置在 Obsidian 库的适当位置
2. 通过 QuickAdd 或其他插件调用该模块
3. 脚本会自动检测当前视图状态并执行相应操作
4. 查看生成的日志文件了解执行详情

## 错误排除经验

### 1. removeEmptyLinesUnderHeadings 函数空行处理问题

#### 问题描述
在测试过程中发现，`removeEmptyLinesUnderHeadings` 函数的空行处理逻辑存在问题，导致排序后任务间的空行被错误删除，影响文档格式。

#### 原始实现问题
原始实现仅保留"下一行是任务开始"的空行，这会导致任务间的一些重要空行被删除：

```javascript
// 原始实现（有问题）
if (nextLine && nextLine.match(/^(\s*)([-*])\s+\[( |x|X)\]/)) {
    // 保留空行
}
```

#### 解决方案
修改空行保留条件，改为检查"前一行是任务/子项或后一行是任务"：

```javascript
// 修复后的实现
const prevLine = j > 0 ? blockLines[j - 1] : null;
const nextLine = j < blockLines.length - 1 ? blockLines[j + 1] : null;

// 保留空行的条件：前一行是任务/子项 或 后一行是任务
const shouldKeep = (prevLine && (
    prevLine.match(/^(\s*)([-*])\s+\[( |x|X)\]/) || // 前一行是任务
    prevLine.match(/^\s{2,}([-*])\s+\[( |x|X)\]/) || // 前一行是子任务
    prevLine.trim() !== '' // 前一行是非空内容（可能是任务的说明文字）
)) || (nextLine && nextLine.match(/^(\s*)([-*])\s+\[( |x|X)\]/)); // 后一行是任务

if (!shouldKeep) {
    // 删除空行
    toRemove.push(j);
}
```

#### 关键经验
1. **空行保留逻辑需全面考虑**：不仅要考虑下一行，也要考虑前一行的情况
2. **任务识别需包含子任务**：子任务（缩进的任务）也需要被正确识别
3. **测试用例需覆盖各种场景**：包括任务间空行、任务与标题间空行等

### 2. reorderByHeading 函数重复调用问题

#### 问题描述
在 `reorderByHeading` 函数中，发现 `removeEmptyLinesUnderHeadings` 函数被重复调用，可能导致不必要的性能开销。

#### 解决方案
确保 `removeEmptyLinesUnderHeadings` 函数只在文本组装完成后调用一次：

```javascript
// 组装回文本
let out = blocks.map((b) => b.lines.join("\n")).join("\n");

// 只在这里调用一次 removeEmptyLinesUnderHeadings
out = removeEmptyLinesUnderHeadings(out);

return { content: out, stats: { taskBlocks, tasksCount, changed } };
```

#### 关键经验
1. **避免重复处理**：确保文本处理函数只在必要时调用一次
2. **性能优化**：注意函数调用次数，避免不必要的性能开销

### 3. 测试脚本验证

#### 测试用例设计
设计全面的测试用例，验证排序功能和空行处理：

```javascript
const testContent = `***
### 灯塔
>**行测加速攻坚，申论保质跟课。**

## 主线任务
- [ ] #申论素养 第八讲补课的1小时15分钟，这篇作文和他的上一个人进行对比分析，看是如何搭桥，如何开头，如何破题的 📅 2025-10-24
- [ ] #申论素养 第九节课营商环境提升的金句，总结、积累、背诵 📅 2025-10-24
- [ ] #申论素养 分析申论第十四讲作文分论点 📅 2025-10-24

***

## 支线任务

- [ ] 刷完言语其他类型题目 📅 2025-11-03
  - 今天要把言语其他类型的题目全部刷完，直接通关。
- [ ] 去新家交暖气费和物业费。失败了，他们周六不上班，所以现在要改天把他们的电话打通，问一下能不能远程从微信上给支付，他们把发票给我开过来。 📅 2025-11-03
- [x] 国考报名确认及缴费 📅 2025-11-01 ✅ 2025-11-03
- [ ] 打印国考准考证 📅 2025-11-24
- [ ] 参加国考考试 📅 2025-11-30
- [ ] 给陈杨新界交暖气费和水费 📅 2025-11-04`;
```

#### 测试验证点
1. **排序功能验证**：
   - 主线任务按截止日期排序
   - 支线任务已完成项前置
   - 未完成项按截止日期升序排列

2. **空行处理验证**：
   - 任务间空行保留
   - 任务与标题间空行保留
   - 连续空行压缩为单行

3. **统计信息验证**：
   - 任务块数量正确
   - 任务总数正确
   - 变更状态正确

#### 关键经验
1. **全面测试**：测试用例应覆盖各种场景，包括不同类型的任务、日期格式、空行处理等
2. **独立测试**：使用独立的测试脚本验证核心功能，避免环境干扰
3. **预期结果验证**：确保测试结果符合预期，特别是排序逻辑和空行处理

## 未来改进方向

1. **性能优化**：减少不必要的视图切换和等待时间
2. **错误处理**：增强异常情况的处理能力
3. **用户界面**：提供更直观的操作反馈
4. **配置选项**：允许用户自定义排序规则和视图行为
5. **空行处理配置**：提供空行处理策略的配置选项，满足不同用户需求

## 结语

TaskReorderModule 的开发过程展示了在 Obsidian 插件开发中处理复杂视图交互的挑战和解决方案。通过精确的视图状态检测、条件性视图切换、多层次编辑器获取和详细的日志记录，我们成功攻克了不同视图模式下的任务重排难题，为类似问题的解决提供了宝贵经验。

关键成功因素包括：
1. **准确理解Obsidian视图模式**：区分阅读视图、实时预览和源码视图，只在必要时切换视图
2. **多层次编辑器获取策略**：针对不同视图模式提供多种编辑器获取方式，确保在各种环境下都能获取到编辑器
3. **精确的视图状态检测**：结合 state.mode 和 state.source 准确判断当前视图模式
4. **时间排序逻辑**：基于完成状态和日期进行排序，而非优先级排序
5. **空行处理逻辑优化**：全面考虑任务前后关系，确保文档格式美观
6. **避免重复处理**：优化函数调用，提高性能

特别是对于实时预览视图的支持，通过多层次编辑器获取策略，确保了在各种视图模式下都能正常工作，大大提高了脚本的兼容性和可靠性。这些经验不仅适用于 TaskReorderModule，也为其他需要处理 Obsidian 视图模式和编辑器获取的插件开发提供了宝贵参考。

在错误排除过程中，我们学到了：
1. **空行处理需全面考虑**：不仅要考虑下一行，也要考虑前一行的情况，确保任务间的空行被正确保留
2. **测试驱动开发**：通过独立的测试脚本验证核心功能，确保在各种场景下都能正常工作
3. **性能优化意识**：避免重复处理，确保函数只在必要时调用一次

这些经验教训将指导我们未来的开发工作，帮助我们构建更加稳定、高效的 Obsidian 插件。