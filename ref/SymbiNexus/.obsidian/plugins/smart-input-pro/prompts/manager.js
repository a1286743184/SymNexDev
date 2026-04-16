const fs = require('fs');
const path = require('path');

class PromptManager {
    constructor(app, pluginDir) {
        this.app = app;
        this.pluginDir = pluginDir;
        // Use absolute paths for fs operations
        this.defaultsPath = path.join(pluginDir, 'prompts', 'defaults.js');
        this.userPath = path.join(pluginDir, 'prompts', 'user.js');
        
        this.defaults = {};
        this.user = { version: 1, overrides: {} };
        
        this.load();
    }

    load() {
        try {
            // Load defaults
            if (fs.existsSync(this.defaultsPath)) {
                // Clear cache to ensure fresh load
                delete require.cache[require.resolve(this.defaultsPath)];
                this.defaults = require(this.defaultsPath);
            } else {
                console.error('[SmartInputPro] Defaults prompt file not found at:', this.defaultsPath);
                this.defaults = { pipeline: {}, modules: {} };
            }

            // Load user overrides
            if (fs.existsSync(this.userPath)) {
                delete require.cache[require.resolve(this.userPath)];
                this.user = require(this.userPath);
            } else {
                // Initialize if not exists
                this.saveUser();
            }
        } catch (error) {
            console.error('[SmartInputPro] Failed to load prompts:', error);
            // Fallback to empty user overrides
            this.user = { version: 1, overrides: {} };
        }
    }

    saveUser() {
        try {
            const content = `module.exports = ${JSON.stringify(this.user, null, 4)};`;
            fs.writeFileSync(this.userPath, content, 'utf8');
        } catch (error) {
            console.error('[SmartInputPro] Failed to save user prompts:', error);
        }
    }

    // --- Getters ---

    getStage1Prompt() {
        return this.user.overrides?.pipeline?.stage1_classification_prompt || 
               this.defaults.pipeline?.stage1_classification_prompt || '';
    }
    
    getStage2Prompt() {
         return this.user.overrides?.pipeline?.stage2_optimization_prompt || 
               this.defaults.pipeline?.stage2_optimization_prompt || '';
    }

    getModulePrompt(moduleId) {
        return this.user.overrides?.modules?.[moduleId]?.extractionPrompt || 
               this.defaults.modules?.[moduleId]?.extractionPrompt || '';
    }

    getAssetLogPrompt() {
        return this.user.overrides?.modules?.bill?.asset_log_prompt || 
               this.defaults.modules?.bill?.asset_log_prompt || '';
    }

    // --- Setters / Migration ---

    saveUserOverride(pathArray, value) {
        // pathArray example: ['pipeline', 'stage1_classification_prompt']
        let current = this.user.overrides;
        for (let i = 0; i < pathArray.length - 1; i++) {
            if (!current[pathArray[i]]) current[pathArray[i]] = {};
            current = current[pathArray[i]];
        }
        
        // Check if value equals default
        const defaultValue = this.getValue(this.defaults, pathArray);
        
        // If value matches default, remove the override to keep user.js clean
        // Note: Use simple string comparison
        if (value === defaultValue) {
             delete current[pathArray[pathArray.length - 1]];
             // Optional: Cleanup empty parent objects could be added here
        } else {
            current[pathArray[pathArray.length - 1]] = value;
        }
        
        this.saveUser();
    }
    
    getValue(obj, pathArray) {
        let current = obj;
        for (const key of pathArray) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        return current;
    }

    migrateFromSettings(settings) {
        console.log('[SmartInputPro] Starting prompt migration...');
        let hasChanges = false;

        // Migrate Pipeline Prompts
        if (settings.pipeline?.stage1_classification_prompt) {
            this.saveUserOverride(['pipeline', 'stage1_classification_prompt'], settings.pipeline.stage1_classification_prompt);
            hasChanges = true;
        }
        if (settings.pipeline?.stage2_optimization_prompt) {
            this.saveUserOverride(['pipeline', 'stage2_optimization_prompt'], settings.pipeline.stage2_optimization_prompt);
            hasChanges = true;
        }

        // Migrate Module Prompts
        if (settings.modules) {
            for (const [moduleId, moduleConfig] of Object.entries(settings.modules)) {
                if (moduleConfig.extractionPrompt) {
                     this.saveUserOverride(['modules', moduleId, 'extractionPrompt'], moduleConfig.extractionPrompt);
                     hasChanges = true;
                }
                if (moduleId === 'bill' && moduleConfig.asset_log_prompt) {
                    this.saveUserOverride(['modules', 'bill', 'asset_log_prompt'], moduleConfig.asset_log_prompt);
                    hasChanges = true;
                }
            }
        }
        
        if (hasChanges) {
             console.log('[SmartInputPro] Migration completed.');
        } else {
             console.log('[SmartInputPro] No prompts to migrate.');
        }
    }
}

module.exports = PromptManager;
