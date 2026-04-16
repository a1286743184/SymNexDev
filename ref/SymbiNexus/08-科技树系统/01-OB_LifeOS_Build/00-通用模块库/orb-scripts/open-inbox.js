module.exports = async (params) => {
  const { app } = params;
  const filePath = '01-经纬矩阵系统/08-智能录入模块/01-INBOX.md';
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    const { Notice } = require('obsidian');
    new Notice(`未找到文件：${filePath}`, 6000);
    return;
  }
  await app.workspace.getLeaf().openFile(file);
};

