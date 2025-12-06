/**
 * GNU Global Integration Module
 * 独立的GNU Global集成模块，可在任何VSCode扩展中使用
 */

const vscode = require('vscode');
const childProcess = require('child-process-promise');
const iconv = require('iconv-lite');

/**
 * GNU Global Integration Class
 */
class GlobalIntegration {
    /**
     * 构造函数
     * @param {string} executablePath - GNU Global可执行文件路径
     */
    constructor(executablePath = 'global') {
        this.exec = executablePath;
        this.updateInProgress = false;
        this.queueUpdate = false;
    }

    /**
     * 获取工作区根目录
     * @returns {string} 工作区根目录路径
     */
    getWorkspaceRoot() {
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        // 兼容旧版本
        return vscode.workspace.rootPath || '';
    }

    /**
     * 获取数据库路径（.vscode目录）
     * @returns {string} 数据库路径
     */
    getDbPath() {
        const path = require('path');
        return path.join(this.getWorkspaceRoot(), '.vscode');
    }

    /**
     * 获取 Maven 源码目录路径
     * @returns {string} Maven 源码路径
     */
    getMavenSourcesPath() {
        const os = require('os');
        const path = require('path');
        return path.join(os.homedir(), '.m2', 'sources');
    }

    /**
     * 获取包含 GTAGSDBPATH 的环境变量
     * @returns {Object} 环境变量对象
     */
    getEnvWithDbPath() {
        const path = require('path');
        const fs = require('fs');
        const mavenSourcesPath = this.getMavenSourcesPath();
        
        const env = {
            ...process.env,
            GTAGSDBPATH: this.getDbPath(),
            GTAGSROOT: this.getWorkspaceRoot()
        };

        // 如果 Maven 源码目录存在且有 GTAGS，添加到 GTAGSLIBPATH
        if (fs.existsSync(path.join(mavenSourcesPath, 'GTAGS'))) {
            env.GTAGSLIBPATH = mavenSourcesPath;
        }

        return env;
    }

    /**
     * 执行GNU Global命令
     * @param {string[]} params - 命令参数
     * @param {string} [cwd] - 工作目录（可选）
     * @param {Object} [env] - 环境变量（可选）
     * @returns {Promise<string>} 命令输出
     */
    async runCommand(params, cwd = null, env = null) {
        const configuration = vscode.workspace.getConfiguration('codegnuglobal');
        const encoding = configuration.get('encoding');

        const command = this.exec + ' ' + params.join(' ');

        try {
            const result = await childProcess.exec(command, {
                cwd: cwd || this.getWorkspaceRoot(),
                encoding: encoding ? 'binary' : 'utf8',
                maxBuffer: 10 * 1024 * 1024,
                env: env || this.getEnvWithDbPath()
            });

            // 如果需要编码转换
            if (encoding && encoding !== '') {
                return iconv.decode(result.stdout, encoding).toString();
            }
            return result.stdout.toString();
        } catch (error) {
            console.error('Global command failed:', error);
            throw error;
        }
    }

    /**
     * 检测文件是否在 Maven 源码目录下
     * @param {string} filePath - 文件路径
     * @returns {boolean}
     */
    isInMavenSources(filePath) {
        const mavenSourcesPath = this.getMavenSourcesPath();
        const normalizedFile = filePath.replace(/\\/g, '/').toLowerCase();
        const normalizedMaven = mavenSourcesPath.replace(/\\/g, '/').toLowerCase();
        return normalizedFile.startsWith(normalizedMaven);
    }

    /**
     * 获取文件所属的项目根目录和环境变量
     * @param {string} filePath - 文件路径
     * @returns {{cwd: string, env: Object}}
     */
    getProjectContext(filePath) {
        if (this.isInMavenSources(filePath)) {
            const mavenSourcesPath = this.getMavenSourcesPath();
            return {
                cwd: mavenSourcesPath,
                env: {
                    ...process.env,
                    GTAGSDBPATH: mavenSourcesPath,
                    GTAGSROOT: mavenSourcesPath
                }
            };
        }
        return {
            cwd: this.getWorkspaceRoot(),
            env: this.getEnvWithDbPath()
        };
    }

    /**
     * 查找符号定义
     * @param {string} symbol - 符号名称
     * @returns {Promise<Array>} 查找结果
     */
    async findDefinition(symbol) {
        const output = await this.runCommand(['--encode-path', '" "', '-xa', symbol]);
        return this.parseOutput(output);
    }

    /**
     * 查找符号引用
     * @param {string} symbol - 符号名称
     * @returns {Promise<Array>} 查找结果
     */
    async findReferences(symbol) {
        const output = await this.runCommand(['--encode-path', '" "', '-rax', symbol]);
        return this.parseOutput(output);
    }

    /**
     * 查找文档符号
     * @param {string} filePath - 文件路径
     * @returns {Promise<Array>} 查找结果
     */
    async findDocumentSymbols(filePath) {
        const context = this.getProjectContext(filePath);
        const output = await this.runCommand(['--encode-path', '" "', '-xaf', filePath], context.cwd, context.env);
        return this.parseOutput(output);
    }

    /**
     * 解析GNU Global输出
     * @param {string} output - 命令输出
     * @returns {Array} 解析结果数组
     */
    parseOutput(output) {
        const results = [];

        if (!output || output.trim() === '') {
            return results;
        }

        const lines = output.toString().split(/\r?\n/);
        lines.forEach(line => {
            const result = this.parseLine(line);
            if (result) {
                results.push(result);
            }
        });

        return results;
    }

    /**
     * 在行内容中查找符号的起始位置
     * @param {string} line - 行内容
     * @param {string} symbol - 符号名称
     * @returns {number} 起始列号
     */
    getSymbolStartIndex(line, symbol) {
        // 使用正则确保匹配完整的符号（不是其他符号的一部分）
        const regex = new RegExp(`([a-zA-Z0-9_]*)${symbol}([a-zA-Z0-9_]*)`, 'g');
        let result;
        while ((result = regex.exec(line)) !== null) {
            if (result[0] === symbol) {
                return result.index;
            }
        }
        // 回退到 indexOf
        return line.indexOf(symbol);
    }

    /**
     * 解析单行输出
     * @param {string} content - 单行内容
     * @returns {Object|null} 解析结果对象
     */
    parseLine(content) {
        try {
            if (!content || content.trim() === '') return null;

            const pathModule = require('path');
            const values = content.split(/ +/);
            const tag = values.shift() || '';
            const line = parseInt(values.shift() || '0') - 1; // 转换为0基索引
            let filePath = (values.shift() || '').replace('%20', ' ');
            const info = values.join(' ');

            // 将相对路径转换为绝对路径
            if (!pathModule.isAbsolute(filePath)) {
                filePath = pathModule.join(this.getWorkspaceRoot(), filePath);
            }

            // 处理路径长度不足16时 global 输出的填充空格
            const trimmedInfo = filePath.length >= 16 ? info : info.substring(16 - filePath.length);

            // 计算符号在行内的起始列号
            const startColumn = this.getSymbolStartIndex(trimmedInfo, tag);
            const endColumn = startColumn + tag.length;

            return {
                tag,
                line,
                path: filePath,
                info: trimmedInfo,
                startColumn,
                endColumn,
                kind: this.parseKind(trimmedInfo)
            };
        } catch (ex) {
            console.error('Error parsing line:', ex);
            return null;
        }
    }

    /**
     * 根据信息字符串解析符号类型
     * @param {string} info - 信息字符串
     * @returns {number} 符号类型
     */
    parseKind(info) {
        let kind = vscode.SymbolKind.Variable;

        if (info.startsWith('class ')) {
            kind = vscode.SymbolKind.Class;
        } else if (info.startsWith('struct ')) {
            kind = vscode.SymbolKind.Class;
        } else if (info.startsWith('enum ')) {
            kind = vscode.SymbolKind.Enum;
        } else if (info.indexOf('(') !== -1) {
            kind = vscode.SymbolKind.Function;
        }

        return kind;
    }

    /**
     * 创建GNU Global数据库到.vscode目录
     * @returns {Promise<void>}
     */
    async createDatabase() {
        const fs = require('fs');
        const dbPath = this.getDbPath();

        // 创建 .vscode 目录（如果不存在）
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }

        // 使用 gtags 命令创建数据库
        // cwd 设为工作区根目录（源码所在位置），传递 dbPath 作为参数指定数据库存储位置
        // 这样 gtags 会扫描工作区根目录的源码，但将 GTAGS/GRTAGS/GPATH 文件创建在 .vscode 目录
        await childProcess.exec(`gtags "${dbPath}"`, {
            cwd: this.getWorkspaceRoot(),
            maxBuffer: 10 * 1024 * 1024,
            env: this.getEnvWithDbPath()
        });
    }

    /**
     * 更新标签文件
     * @returns {Promise<void>}
     */
    async updateTags() {
        const configuration = vscode.workspace.getConfiguration('codegnuglobal');
        const shouldUpdate = configuration.get('autoupdate', true);

        if (!shouldUpdate) return;

        if (this.updateInProgress) {
            this.queueUpdate = true;
        } else {
            this.updateInProgress = true;
            try {
                await this.runCommand(['-u']);
            } catch (error) {
                // 检查是否是 GTAGS 不存在的错误
                if (error && error.code === 3) {
                    const createDB = await vscode.window.showInformationMessage(
                        'GNU Global database not found. Would you like to create it now?',
                        'Create Database', 'Learn More'
                    );

                    if (createDB === 'Create Database') {
                        try {
                            await this.createDatabase();
                            vscode.window.showInformationMessage('GNU Global database created successfully in .vscode directory!');
                        } catch (createError) {
                            vscode.window.showErrorMessage(`Failed to create GNU Global database: ${createError.message}`);
                        }
                    } else if (createDB === 'Learn More') {
                        vscode.env.openExternal(vscode.Uri.parse('https://www.gnu.org/software/global/globalhtml_toc.html'));
                    }
                }
                throw error;
            } finally {
                this.updateInProgress = false;
                if (this.queueUpdate) {
                    this.queueUpdate = false;
                    this.updateTags();
                }
            }
        }
    }
}

/**
 * 可重用的DefinitionProvider
 */
class ReusableDefinitionProvider {
    /**
     * 构造函数
     * @param {GlobalIntegration} global - GNU Global集成实例
     */
    constructor(global) {
        this.global = global;
    }

    /**
     * 从 import 语句中提取全限定类名的路径模式
     * @param {string} line - 当前行文本
     * @param {string} word - 当前符号
     * @returns {string|null} 路径模式（如 com/google/common/collect/Lists）或 null
     */
    extractImportPathPattern(line, word) {
        // 匹配 Java import: import com.google.common.collect.Lists;
        const javaImportMatch = line.match(/^\s*import\s+(static\s+)?([a-zA-Z0-9_.]+);?\s*$/);
        if (javaImportMatch) {
            const fullPath = javaImportMatch[2];
            // 确保 import 的最后部分是我们要找的符号
            if (fullPath.endsWith('.' + word) || fullPath === word) {
                // 转换为路径模式：com.google.common.collect.Lists -> com/google/common/collect/Lists
                return fullPath.replace(/\./g, '/');
            }
        }

        // 匹配 C/C++ include: #include <google/protobuf/message.h>
        const cIncludeMatch = line.match(/^\s*#\s*include\s*[<"]([^>"]+)[>"]/);
        if (cIncludeMatch) {
            const includePath = cIncludeMatch[1];
            // 返回 include 路径（去掉扩展名）
            return includePath.replace(/\.[^.]+$/, '');
        }

        return null;
    }

    /**
     * 根据路径模式过滤结果
     * @param {Array} results - 查找结果
     * @param {string} pathPattern - 路径模式
     * @returns {Array} 过滤后的结果
     */
    filterByPathPattern(results, pathPattern) {
        if (!pathPattern) return results;

        // 标准化路径分隔符
        const normalizedPattern = pathPattern.replace(/\\/g, '/');
        
        const filtered = results.filter(result => {
            const normalizedPath = result.path.replace(/\\/g, '/');
            return normalizedPath.includes(normalizedPattern);
        });

        // 如果过滤后有结果，返回过滤后的；否则返回原始结果
        return filtered.length > 0 ? filtered : results;
    }

    /**
     * 提供定义查找功能
     * @param {vscode.TextDocument} document - 文档对象
     * @param {vscode.Position} position - 位置
     * @param {vscode.CancellationToken} token - 取消令牌
     * @returns {Promise<vscode.Definition|Array|null>} 定义位置
     */
    async provideDefinition(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return null;

        const word = document.getText(wordRange).split(/\r?\n/)[0];
        if (!word) return null;

        try {
            let results = await this.global.findDefinition(word);

            if (results.length === 0) return null;

            // 如果有多个结果，尝试根据 import/include 语句过滤
            if (results.length > 1) {
                const currentLine = document.lineAt(position.line).text;
                const pathPattern = this.extractImportPathPattern(currentLine, word);
                results = this.filterByPathPattern(results, pathPattern);
            }

            // 返回带精确范围的 Location
            return results.map(result => new vscode.Location(
                vscode.Uri.file(result.path),
                new vscode.Range(
                    result.line, result.startColumn,
                    result.line, result.endColumn
                )
            ));
        } catch (error) {
            console.error('Definition lookup failed:', error);
            return null;
        }
    }
}

/**
 * 可重用的ReferenceProvider
 */
class ReusableReferenceProvider {
    /**
     * 构造函数
     * @param {GlobalIntegration} global - GNU Global集成实例
     */
    constructor(global) {
        this.global = global;
    }

    /**
     * 提供引用查找功能
     * @param {vscode.TextDocument} document - 文档对象
     * @param {vscode.Position} position - 位置
     * @param {Object} options - 选项
     * @param {vscode.CancellationToken} token - 取消令牌
     * @returns {Promise<Array>} 引用位置数组
     */
    async provideReferences(document, position, options, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return [];

        const word = document.getText(wordRange).split(/\r?\n/)[0];
        if (!word) return [];

        try {
            const results = await this.global.findReferences(word);

            // 返回带精确范围的 Location
            return results.map(result =>
                new vscode.Location(
                    vscode.Uri.file(result.path),
                    new vscode.Range(
                        result.line, result.startColumn,
                        result.line, result.endColumn
                    )
                )
            );
        } catch (error) {
            console.error('Reference lookup failed:', error);
            return [];
        }
    }
}

/**
 * 可重用的DocumentSymbolProvider
 */
class ReusableDocumentSymbolProvider {
    /**
     * 构造函数
     * @param {GlobalIntegration} global - GNU Global集成实例
     */
    constructor(global) {
        this.global = global;
    }

    /**
     * 提供文档符号功能
     * @param {vscode.TextDocument} document - 文档对象
     * @param {vscode.CancellationToken} token - 取消令牌
     * @returns {Promise<Array>} 文档符号数组
     */
    async provideDocumentSymbols(document, token) {
        try {
            const results = await this.global.findDocumentSymbols(document.fileName);

            return results.map(result =>
                new vscode.DocumentSymbol(
                    result.tag,
                    result.info,
                    result.kind,
                    new vscode.Range(result.line, result.startColumn, result.line, result.endColumn),
                    new vscode.Range(result.line, result.startColumn, result.line, result.endColumn)
                )
            );
        } catch (error) {
            console.error('Document symbols lookup failed:', error);
            return [];
        }
    }
}

module.exports = {
    GlobalIntegration,
    ReusableDefinitionProvider,
    ReusableReferenceProvider,
    ReusableDocumentSymbolProvider
};