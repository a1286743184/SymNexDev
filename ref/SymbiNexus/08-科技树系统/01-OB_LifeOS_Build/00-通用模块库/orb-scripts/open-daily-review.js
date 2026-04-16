module.exports = async (params) => {
  const { quickAddApi: QuickAdd, app } = params;
  
  // 获取当前东八区时间
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const beijingTime = new Date(utc + (3600000 * 8)); // 东八区时间
  
  // 获取小时数
  const hour = beijingTime.getHours();
  
  // 如果是凌晨三点之前，则使用前一天的日期
  let targetDate;
  if (hour < 3) {
    targetDate = new Date(beijingTime);
    targetDate.setDate(beijingTime.getDate() - 1);
  } else {
    targetDate = beijingTime;
  }
  
  // 格式化日期
  const year = targetDate.getFullYear().toString().slice(-2);
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const day = targetDate.getDate().toString().padStart(2, '0');
  
  // 构建文件路径
  const fileName = `足迹${year}-${month}-${day}.md`;
  const filePath = `02-复盘系统/01-日复盘/${fileName}`;
  const templatePath = `04-模板系统/01-复盘模板/日复盘.md`;
  
  // 检查文件是否存在
  const file = app.vault.getAbstractFileByPath(filePath);
  
  // 如果文件不存在，则创建
  if (!file) {
    const templateFile = app.vault.getAbstractFileByPath(templatePath);
    
    if (templateFile) {
      // 从模板创建文件
      const templateContent = await app.vault.read(templateFile);
      await app.vault.create(filePath, templateContent);
    } else {
      // 创建空文件
      await app.vault.create(filePath, '');
    }
  }
  
  // 打开文件
  const targetFile = app.vault.getAbstractFileByPath(filePath);
  if (targetFile) {
    await app.workspace.getLeaf().openFile(targetFile);
  }
};

