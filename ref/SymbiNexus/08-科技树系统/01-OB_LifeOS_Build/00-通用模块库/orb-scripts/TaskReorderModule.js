/**
 * QuickAdd 用户脚本：在当前激活的文档中，按"每个标题内"对 Markdown 任务进行重排
 * 规则：
 * 1) 已完成任务排在未完成任务之前（仅在相同标题内排序，不跨标题）
 * 2) 已完成任务按：有完成日期(✅/done) > 有截止日期(📅/due) > 无日期；其中完成日期按最新优先（降序），截止日期按最近优先（升序）
 * 3) 未完成任务按：有截止日期(📅/due) > 无日期；其中截止日期按最近优先（升序）
 * 4) 每条任务的子项目（如以两个空格缩进的 "- ..." 描述行）会与其父任务一起移动
 * 5) 重排时会删除标题下的空行（除了紧挨着下一个标题的空行）
 *
 * 兼容日期格式示例：
 *  - 截止日期：📅 2025-10-10 或 "due 2025-10-10"
 *  - 完成日期：✅ 2025-10-10 或 "done 2025-10-10"
 *
 * 安装使用：
 *  - 将本文件保存到：08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/TaskReorderModule.js
 */

// 简化的日志记录工具 - 仅保留控制台输出，移除文件写入
const Logger = {
  // 初始化日志 - 保留时序但不执行实际操作
  init: async function() {
    // 保留原有的异步等待时序，但不执行任何实际操作
    await new Promise(resolve => setTimeout(resolve, 10));
  },
  
  // 记录日志 - 仅输出到控制台
  log: function(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
  },
  
  // 完成并写入日志 - 保留时序但不执行文件写入
  finish: async function() {
    // 保留原有的异步等待时序，但不执行任何实际操作
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

/** 辅助：安全解析日期为时间戳（数字），便于排序。返回 null 表示无法解析 */
function toTime(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/** 判断是否为标题行（支持 "## 标题" 与 "##标题"）*/
function isHeading(line) {
  return /^\s{0,3}#{1,6}(?!#)\s*\S/.test(line);
}

/** 判断是否为任务起始行，返回匹配信息或 null */
function matchTaskStart(line) {
  const m = line.match(/^(\s*)([-*])\s+\[( |x|X)\]/);
  if (!m) return null;
  return { indent: m[1] || "", bullet: m[2], checked: /x/i.test(m[3]) };
}

/** 在整条任务文本中提取截止日期（📅 或 due） */
function extractDueDate(text) {
  if (!text) return null;
  const m1 = text.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
  if (m1) return m1[1];
  const m2 = text.match(/\bdue\s+(\d{4}-\d{2}-\d{2})\b/i);
  if (m2) return m2[1];
  const m3 = text.match(/截止(?:日期)?[:：]?\s*(\d{4}-\d{2}-\d{2})/);
  if (m3) return m3[1];
  return null;
}

/** 在整条任务文本中提取完成日期（✅ 或 done） */
function extractDoneDate(text) {
  if (!text) return null;
  const m1 = text.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
  if (m1) return m1[1];
  const m2 = text.match(/\bdone\s+(\d{4}-\d{2}-\d{2})\b/i);
  if (m2) return m2[1];
  const m3 = text.match(/完成(?:日期)?[:：]?\s*(\d{4}-\d{2}-\d{2})/);
  if (m3) return m3[1];
  return null;
}

/** 对单个任务项生成排序键 */
function makeSortKey(item) {
  const text = item.lines.join("\n");
  const due = extractDueDate(text);
  const done = extractDoneDate(text);
  const dueTime = toTime(due);
  const doneTime = toTime(done);
  return {
    completed: item.completed,
    due,
    done,
    dueTime,
    doneTime,
    originalIndex: item.originalIndex,
  };
}

/**
 * 任务排序规则：
 * - 已完成：有完成日期降序 > 有截止日期升序 > 无日期（保持原相对顺序）
 * - 未完成：有截止日期升序 > 无日期（保持原相对顺序）
 * 同一层级内，已完成整体排在未完成之前
 */
function sortItems(items) {
  const enriched = items.map((it) => ({ ...it, key: makeSortKey(it) }));
  const completed = enriched.filter((e) => e.key.completed);
  const pending = enriched.filter((e) => !e.key.completed);

  // 已完成排序
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

  // 未完成排序
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

  return [...completed, ...pending].map((e) => e.lines).flat();
}

/**
 * 将整篇内容切分为块：heading / task_block / other
 * 并在存在上级标题时，仅对 task_block 进行排序，其他块原样保留
 */
async function reorderByHeading(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];

  let i = 0;
  // 若整篇文档没有任何标题，则视为"同一标题下"的单一版块（允许进行排序）
  const noHeadingDoc = !lines.some(isHeading);
  
  let currentHeading = noHeadingDoc ? "__DEFAULT__" : null; // 保存最近的标题文本
  let taskBlocks = 0;
  let tasksCount = 0;
  let changed = false;

  function isTaskStartWithIndent(line, indent) {
    const m = matchTaskStart(line);
    return !!(m && m.indent === indent);
  }

  while (i < lines.length) {
    const line = lines[i];

    // 硬分隔线（*** 或 ---）：视为版块边界，并重置标题上下文（无标题文档不重置）
    if (/^\s*(\*\*\*|---)\s*$/.test(line)) {
      blocks.push({ type: "other", lines: [line] });
      if (!noHeadingDoc) currentHeading = null;
      i += 1;
      continue;
    }

    if (isHeading(line)) {
      currentHeading = line;
      blocks.push({ type: "heading", lines: [line] });
      i += 1;
      continue;
    }

    const mStart = matchTaskStart(line);
    if (mStart) {
      const baseIndent = mStart.indent;
      const items = [];

      // 收集同一缩进层级下的连续任务项
      while (i < lines.length) {
        const l = lines[i];
        if (isHeading(l)) break; // 不跨标题
        const m = matchTaskStart(l);
        if (!m || m.indent !== baseIndent) break; // 非同层任务则结束本块

        // 开始收集此任务项的完整行（包括随后的子行）
        const itemLines = [];
        const startInfo = m;
        itemLines.push(l);
        i += 1;

        // 收集子行：直到下一个"同层任务"或标题
        while (i < lines.length) {
          const nl = lines[i];
          // 分隔线也作为任务块边界，避免被归入某个任务项附属内容
          if (/^\s*(\*\*\*|---)\s*$/.test(nl)) break;
          if (isHeading(nl)) break; // 到标题则结束
          const nm = matchTaskStart(nl);
          if (nm && nm.indent === baseIndent) break; // 下一个同层任务开始

          // 其他任何行（空行、说明、子项目等）视为该任务的附属内容
          // 空行也作为任务的附属内容，保留任务之间的分隔
          itemLines.push(nl);
          i += 1;
        }

        items.push({
          lines: itemLines,
          completed: startInfo.checked,
          originalIndex: items.length,
        });
      }

      // 修改逻辑：无论任务块是否属于标题，都进行排序
      // 这样可以确保文档开头的任务块也能被正确排序
      taskBlocks += 1;
      tasksCount += items.length;
      const originalLines = items.map((it) => it.lines).flat();
      const sortedLines = sortItems(items);
      
      // 判断该任务块是否发生变化
      const hasChanged = sortedLines.join("\n") !== originalLines.join("\n");
      if (hasChanged) changed = true;
      
      blocks.push({ type: "task_block", lines: sortedLines });
      continue;
    }

    // 收集非标题、非任务的普通行
    const other = [];
    while (i < lines.length) {
      const l2 = lines[i];
      if (isHeading(l2) || matchTaskStart(l2)) break;
      other.push(l2);
      i += 1;
    }
    blocks.push({ type: "other", lines: other });
  }

  // 组装回文本
  let out = blocks.map((b) => b.lines.join("\n")).join("\n");
  
  // 处理标题下的空行：删除标题下的空行（除了紧挨着下一个标题的空行）
  out = removeEmptyLinesUnderHeadings(out);
  
  return { content: out, stats: { taskBlocks, tasksCount, changed } };
}

/**
 * 删除标题下的空行（除了紧挨着下一个标题的空行）
 * @param {string} content - 文档内容
 * @returns {string} 处理后的内容
 */
function removeEmptyLinesUnderHeadings(content) {
  const lines = content.split(/\r?\n/);
  const result = [];
  const isSeparator = (l) => /^\s*(\*\*\*|---)\s*$/.test(l);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (isHeading(line)) {
      // 标题行保留
      result.push(line);
      i++;

      // 收集标题块内容，直到下一个标题或分隔线
      const block = [];
      while (i < lines.length && !isHeading(lines[i]) && !isSeparator(lines[i])) {
        block.push(lines[i]);
        i++;
      }

      // 删除块内多余的空行，但保留任务之间的单个空行
      const cleaned = [];
      let prevLineEmpty = false;
      
      for (let j = 0; j < block.length; j++) {
        const l = block[j];
        const isEmpty = l.trim() === '';
        
        // 如果当前行是空行，且前一行也是空行，则跳过
        if (isEmpty && prevLineEmpty) {
          continue;
        }
        
        // 判断是否需要保留空行
        if (isEmpty) {
          // 检查前一行是否是任务或子项
          const prevIsTask = j > 0 && matchTaskStart(block[j - 1]);
          const prevIsSubItem = j > 0 && block[j - 1].trim().startsWith('  ');
          
          // 检查后一行是否是任务
          const nextIsTask = j + 1 < block.length && matchTaskStart(block[j + 1]);
          
          // 如果前一行是任务/子项或后一行是任务，则保留空行
          if (prevIsTask || prevIsSubItem || nextIsTask) {
            cleaned.push(l);
            prevLineEmpty = true;
            continue;
          }
          
          // 其他情况跳过空行
          continue;
        }
        
        cleaned.push(l);
        prevLineEmpty = isEmpty;
      }
      
      result.push(...cleaned);

      // 在标题块与下一个标题/分隔线之间保留 1 行空行作为分隔
      if (i < lines.length && (isHeading(lines[i]) || isSeparator(lines[i]))) {
        // 避免重复添加：只有当上一行不是空行时才插入
        if (result.length === 0 || result[result.length - 1].trim() !== '') {
          result.push('');
        }
      }

      // 不消费边界行（下一个循环处理）
      continue;
    }

    // 非标题与分隔线的普通行原样保留
    result.push(line);
    i++;
  }

  return result.join('\n');
}

/** 主执行函数（QuickAdd 入口） */
module.exports = async (params, context) => {
  try {
    // 初始化日志 - 保留时序但不执行实际操作
    await Logger.init();
    Logger.log("开始执行 TaskReorder 脚本");
    
    const { app, quickAddApi } = context || {};
    const obsApp = app || (typeof window !== 'undefined' ? window.app : null);
    let editor = null;

    // 轻量通知工具
    const NoticeClass = (typeof Notice !== 'undefined') ? Notice : (typeof window !== 'undefined' ? window.Notice : null);
    const notify = (msg) => { 
      try { 
        if (NoticeClass) new NoticeClass(msg, 4000); 
      } catch(_){} 
      console.log(msg); 
      Logger.log(msg);
    };

    // --- 修正后的视图状态检测逻辑 ---
    let originalViewMode = null; // 用于存储原始视图状态: 'reading', 'live', 'source'

    let obsidianModule;
    try {
      Logger.log("开始检测视图状态");
      
      // 尝试多种方式获取 obsidian 模块
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

    // --- 编辑器获取逻辑 ---
    Logger.log("开始获取编辑器");
    
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
          const viewKeys = Object.keys(activeView);
          Logger.log(`activeView 的属性: ${viewKeys.join(', ')}`);
          
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

    // 6) 最后的备用方案：尝试通过更通用的方式获取编辑器
    if (!editor) {
      Logger.log("尝试通过更通用的方式获取编辑器");
      
      if (obsApp?.workspace?.getLeaves) {
        const leaves = obsApp.workspace.getLeaves();
        for (const leaf of leaves) {
          if (leaf?.view?.editor) {
            editor = leaf.view.editor;
            Logger.log("通过遍历所有叶子节点获取编辑器成功");
            break;
          }
        }
      }
      
      if (!editor && typeof window !== 'undefined') {
        const activeEditor = window.activeEditor;
        if (activeEditor?.editor) {
          editor = activeEditor.editor;
          Logger.log("通过 window.activeEditor 获取编辑器成功");
        }
      }
      
      if (!editor && quickAddApi) {
        try {
          const file = quickAddApi.utility.getClipboard();
          if (file) {
            Logger.log("将通过文件读写模式处理内容");
          }
        } catch (e) {
          Logger.log(`通过 QuickAdd API 获取内容失败: ${e.message}`);
        }
      }
    }

    // 7) 对于实时预览视图的特殊处理：如果无法获取编辑器，尝试切换到源码视图
    if (!editor && originalViewMode === 'live') {
      Logger.log("实时预览视图下无法获取编辑器，尝试切换到源码视图");
      
      try {
        await obsApp.commands.executeCommandById('markdown:toggle-source');
        await new Promise(resolve => setTimeout(resolve, 300));
        Logger.log("已切换到源码视图");
        
        const activeViewAfterSwitch = obsApp?.workspace?.getActiveView?.();
        if (activeViewAfterSwitch?.editor) {
          editor = activeViewAfterSwitch.editor;
          Logger.log("切换到源码视图后成功获取编辑器");
        }
        
        if (!editor && obsApp?.workspace?.activeEditor?.editor) {
          editor = obsApp.workspace.activeEditor.editor;
          Logger.log("切换到源码视图后通过 workspace.activeEditor.editor 获取编辑器成功");
        }
      } catch (e) {
        Logger.log(`切换到源码视图失败: ${e.message}`);
      }
    }

    // 8) 对于实时预览视图和阅读视图的特殊处理：如果仍然无法获取编辑器，尝试直接读写文件
    if (!editor && (originalViewMode === 'live' || originalViewMode === 'reading')) {
      Logger.log(`${originalViewMode}视图下仍然无法获取编辑器，尝试直接读写文件`);
      
      try {
        const activeFile = obsApp?.workspace?.getActiveFile?.();
        if (activeFile) {
          Logger.log(`获取到当前文件: ${activeFile.path}`);
          
          const fileContent = await obsApp.vault.read(activeFile);
          Logger.log(`读取文件内容成功，长度: ${fileContent.length}`);
          
          const result = await reorderByHeading(fileContent);
          
          Logger.log(`处理结果: 任务块=${result.stats.taskBlocks}, 任务数=${result.stats.tasksCount}, 是否变更=${result.stats.changed}`);
          
          if (result.stats.changed) {
            const contentAfterRemoveEmptyLines = removeEmptyLinesUnderHeadings(result.content);
            await obsApp.vault.modify(activeFile, contentAfterRemoveEmptyLines);
            Logger.log("文件内容已更新");
            if (contentAfterRemoveEmptyLines !== result.content) {
              notify(`[TaskReorder] 处理任务块 ${result.stats.taskBlocks} 个，任务 ${result.stats.tasksCount} 条，已重排并清理空行。`);
            } else {
              notify(`[TaskReorder] 处理任务块 ${result.stats.taskBlocks} 个，任务 ${result.stats.tasksCount} 条，已重排。`);
            }
          } else {
            const contentAfterRemoveEmptyLines = removeEmptyLinesUnderHeadings(fileContent);
            if (contentAfterRemoveEmptyLines !== fileContent) {
              Logger.log("没有任务重排，但删除了标题下的空行");
              await obsApp.vault.modify(activeFile, contentAfterRemoveEmptyLines);
              notify("[TaskReorder] 已删除标题下的空行。");
            } else {
              notify(`[TaskReorder] 未检测到需要重排的任务（任务块：${result.stats.taskBlocks}，任务数：${result.stats.tasksCount}）。`);
            }
          }
          
          if (originalViewMode === 'reading') {
            try {
              Logger.log("尝试切换回阅读视图");
              await obsApp.commands.executeCommandById('markdown:toggle-preview');
              Logger.log("已切换回阅读视图");
            } catch (e) {
              Logger.log(`切换回阅读视图失败: ${e.message}`);
            }
          } else if (originalViewMode === 'live') {
            try {
              Logger.log("尝试切换回实时预览视图");
              await obsApp.commands.executeCommandById('markdown:toggle-source');
              Logger.log("已切换回实时预览视图");
            } catch (e) {
              Logger.log(`切换回实时预览视图失败: ${e.message}`);
            }
          }
          
          Logger.log("任务重排完成（通过文件读写）");
          await Logger.finish();
          return;
        } else {
          Logger.log("无法获取当前文件");
        }
      } catch (e) {
        Logger.log(`直接读写文件失败: ${e.message}`);
      }
    }

    if (editor) {
      Logger.log(`成功获取编辑器，类型: ${typeof editor}, 函数: ${typeof editor.getValue}`);
      
      try {
        const content = editor.getValue();
        Logger.log(`获取到内容，长度: ${content.length}, 前100字符: ${content.substring(0, 100)}`);
        
        const result = await reorderByHeading(content);
        
        Logger.log(`处理结果: 任务块=${result.stats.taskBlocks}, 任务数=${result.stats.tasksCount}, 是否变更=${result.stats.changed}`);
        
        if (result.stats.changed) {
          const contentAfterRemoveEmptyLines = removeEmptyLinesUnderHeadings(result.content);
          Logger.log(`设置新内容，长度: ${contentAfterRemoveEmptyLines.length}, 前100字符: ${contentAfterRemoveEmptyLines.substring(0, 100)}`);
          editor.setValue(contentAfterRemoveEmptyLines);
          try {
            const activeFileForSave = obsApp?.workspace?.getActiveFile?.();
            if (activeFileForSave) {
              await obsApp.vault.modify(activeFileForSave, contentAfterRemoveEmptyLines);
            }
          } catch (_e) {}
          
          if (editor && typeof editor.refresh === 'function') {
            editor.refresh();
          }
          
          if (contentAfterRemoveEmptyLines !== result.content) {
            notify(`[TaskReorder] 处理任务块 ${result.stats.taskBlocks} 个，任务 ${result.stats.tasksCount} 条，已重排并清理空行。`);
          } else {
            notify(`[TaskReorder] 处理任务块 ${result.stats.taskBlocks} 个，任务 ${result.stats.tasksCount} 条，已重排。`);
          }
        } else {
          const contentAfterRemoveEmptyLines = removeEmptyLinesUnderHeadings(content);
          if (contentAfterRemoveEmptyLines !== content) {
            Logger.log("没有任务重排，但删除了标题下的空行");
            editor.setValue(contentAfterRemoveEmptyLines);
            try {
              const activeFileForSave = obsApp?.workspace?.getActiveFile?.();
              if (activeFileForSave) {
                await obsApp.vault.modify(activeFileForSave, contentAfterRemoveEmptyLines);
              }
            } catch (_e) {}
            notify("[TaskReorder] 已删除标题下的空行。");
          } else {
            notify(`[TaskReorder] 未检测到需要重排的任务（任务块：${result.stats.taskBlocks}，任务数：${result.stats.tasksCount}）。`);
          }
        }
      } catch (e) {
        Logger.log(`重排失败: ${e.message}`);
        notify(`[TaskReorder] 执行失败：${e.message}`);
      }
    } else {
      notify("[TaskReorder] 无法获取编辑器，请确认当前处于可编辑的 Markdown 文档中。");
    }

    await Logger.finish();
  } catch (e) {
    try { console.error(e); } catch {}
  }
};

