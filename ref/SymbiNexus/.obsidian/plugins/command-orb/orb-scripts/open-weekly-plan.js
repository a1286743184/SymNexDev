function getISOWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

module.exports = async (params) => {
  const { app } = params;
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const beijingTime = new Date(utc + (3600000 * 8));

  const weekYear = getISOWeekYear(beijingTime);
  const week = String(getISOWeek(beijingTime)).padStart(2, '0');
  const filePath = `01-经纬矩阵系统/02-周委托模块/周度委托列表${weekYear}W${week}.md`;

  const file = app.vault.getAbstractFileByPath(filePath);
  if (!file) {
    const { Notice } = require('obsidian');
    new Notice(`未找到文件：${filePath}`, 6000);
    return;
  }
  await app.workspace.getLeaf().openFile(file);
};

