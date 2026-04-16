module.exports = async (params) => {
  const { app } = params || {};
  const { Notice } = require('obsidian');
  const pluginId = 'image-converter';

  const plugins = app?.plugins;
  const hasManifest = !!plugins?.manifests?.[pluginId];
  if (!hasManifest) {
    new Notice(`未找到插件：${pluginId}`, 6000);
    return;
  }

  const isPluginEnabled = () => {
    const enabled = plugins?.enabledPlugins;
    if (enabled && typeof enabled.has === 'function') return enabled.has(pluginId);
    if (Array.isArray(enabled)) return enabled.includes(pluginId);
    if (enabled && typeof enabled === 'object') return !!enabled[pluginId];
    return !!plugins?.plugins?.[pluginId];
  };

  const wasEnabled = isPluginEnabled();
  const enable = plugins?.enablePluginAndSave || plugins?.enablePlugin;
  const disable = plugins?.disablePluginAndSave || plugins?.disablePlugin;
  if (typeof enable !== 'function' || typeof disable !== 'function') {
    new Notice('当前 Obsidian 版本不支持脚本切换插件', 6000);
    return;
  }

  try {
    if (wasEnabled) await disable.call(plugins, pluginId);
    else await enable.call(plugins, pluginId);

    const nowEnabled = isPluginEnabled();
    if (wasEnabled && !nowEnabled) new Notice('Image Converter 已关闭', 3000);
    else if (!wasEnabled && nowEnabled) new Notice('Image Converter 已开启', 3000);
    else new Notice(`切换可能未生效：当前状态仍为${nowEnabled ? '开启' : '关闭'}`, 6000);
  } catch (e) {
    new Notice(`切换失败：${e?.message || e}`, 6000);
  }
};
