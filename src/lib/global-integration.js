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
     * 获取包含 GTAGSDBPATH 的环境变量
     * @returns {Object} 环境变量对象
     */
    getEnvWithDbPath() {
        return {
            ...process.env,
            GTAGSDBPATH: this.getDbPath(),
            GTAGSROOT: this.getWorkspaceRoot()
        };
    }

    /**
     * 执行GNU Global命令
     * @param {string[]} params - 命令参数
     * @returns {Promise<string>} 命令输出
     */
    async runCommand(params) {
        const configuration = vscode.workspace.getConfiguration('codegnuglobal');
        const encoding = configuration.get('encoding');

        const command = this.exec + ' ' + params.join(' ');

        try {
            const result = await childProcess.exec(command, {
                cwd: this.getWorkspaceRoot(),
                encoding: encoding ? 'binary' : 'utf8',
                maxBuffer: 10 * 1024 * 1024,
                env: this.getEnvWithDbPath()
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
     * @returns {Promise<Array>} 查找结果
     */
    async findDocumentSymbols() {
        const output = await this.runCommand(['--encode-path', '" "', '-x']);
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

        // 使用 gtags 命令创建数据库，通过 GTAGSDBPATH 环境变量指定存储位置
        await childProcess.exec('gtags', {
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
            const results = await this.global.findDefinition(word);

            if (results.length === 0) return null;

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
            const results = await this.global.findDocumentSymbols();

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