const json2go = require("./lib/json2go")
const gostruct2json = require("./lib/gostruct2json")
const excel = require("./lib/excel")
const { GlobalIntegration, ReusableDefinitionProvider, ReusableReferenceProvider, ReusableDocumentSymbolProvider } = require('./lib/global-integration')
const vscode = require("vscode")
const { exec } = require("child_process")

// GNU Global 集成实例
const globalIntegration = new GlobalIntegration()

function convertjson() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  var res = json2go.json2go(text, "ToChange", false);
  if (res.error) {
    vscode.window.showErrorMessage("There's some wrong in your json!");
    return;
  } else {
    editor.edit(editorBuilder => {
      editorBuilder.replace(selection, res.go);
      vscode.window.showInformationMessage("Generate Go Struct Succeed!");
    });
  }
}

function convertgosturct() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  var res = gostruct2json.gostruct2json(text);
  vscode.env.clipboard.writeText(res);
  vscode.window.showInformationMessage("Generate JSON Succeed!");
}

function b64encode() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  var buffer = Buffer.from(text, 'utf-8')
  var res = buffer.toString('base64');

  editor.edit(editorBuilder => {
    editorBuilder.replace(selection, res);
    vscode.window.showInformationMessage("Base64 Encode Succeed!");
  });
}

function b64decode() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  var buffer = Buffer.from(text, 'base64')
  var res = buffer.toString('utf-8');

  editor.edit(editorBuilder => {
    editorBuilder.replace(selection, res);
    vscode.window.showInformationMessage("Base64 Decode Succeed!");
  });
}

// generate current timestamp
function currentTimestamp() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  const currentDate = new Date();
  const timestamp = currentDate.getTime();
  editor.edit(editorBuilder => {
    editorBuilder.insert(editor.selection.active, `${parseInt(timestamp / 1000)}`);
    vscode.window.showInformationMessage("Get Current Timestamp Succeed!");
  });
}

// parse timestamp from datetime string
function parseTimestamp() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  var ts = new Date(text);
  editor.edit(editorBuilder => {
    editorBuilder.replace(selection, "" + parseInt(ts.getTime() / 1000));
    vscode.window.showInformationMessage("Base64 Decode Succeed!");
  });
}

// to datetime string , eg 2021-03-02 16:41:26
function formatTimestamp() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  var ts = new Date(parseFloat(text) * 1000);
  editor.edit(editorBuilder => {
    editorBuilder.replace(selection, ts.toISOString());
    vscode.window.showInformationMessage("Base64 Decode Succeed!");
  });
}

function urlencode() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  editor.edit(editorBuilder => {
    editorBuilder.replace(selection, encodeURIComponent(text));
    vscode.window.showInformationMessage("URLEecode Succeed!");
  });
}

function urldecode() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  editor.edit(editorBuilder => {
    editorBuilder.replace(selection, decodeURIComponent(text));
    vscode.window.showInformationMessage("URLEecode Succeed!");
  });
}

function exceltojson() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  editor.edit(editorBuilder => {
    let { success, content } = excel.exceltojson(0, text)
    if (success) {
      editorBuilder.replace(selection, content);
      vscode.window.showInformationMessage("Excel Convert Succeed!");
    } else {
      vscode.window.showErrorMessage("Excel Convert Fail!");
    }
  });
}

function jsontoexcel() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Only work in active editor!");
    return; // No open text editor
  }
  var selection = editor.selection;
  var text = editor.document.getText(selection);
  editor.edit(editorBuilder => {
    let { success, content } = excel.jsontoexcel(text)
    if (success) {
      editorBuilder.replace(selection, content);
      vscode.window.showInformationMessage("Json Convert Excel Succeed!");
    } else {
      vscode.window.showErrorMessage("Json Convert Excel Fail!");
    }
  });
}


async function toCenter() {
  let currentLineNumber = vscode.window.activeTextEditor.selection.start.line;
  ;
  await vscode.commands.executeCommand("revealLine", {
    lineNumber: currentLineNumber,
    at: "center"
  });
}

async function toTop() {
  let currentLineNumber = vscode.window.activeTextEditor.selection.start.line;
  await vscode.commands.executeCommand("revealLine", {
    lineNumber: currentLineNumber,
    at: "top"
  });
}

async function toBottom() {
  let currentLineNumber = vscode.window.activeTextEditor.selection.start.line;
  await vscode.commands.executeCommand("revealLine", {
    lineNumber: currentLineNumber,
    at: "bottom"
  });
}

async function openInIdea() {
  // get current file path
  let currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
  
  // 读取配置的命令路径，如果没有配置则使用默认的 idea64
  const config = vscode.workspace.getConfiguration('busybox');
  const ideaCmd = config.get('idea.cmd.path', 'idea64');
  
  // 使用 child_process 直接执行命令，无需显示终端
  const quotedPath = `"${currentFilePath}"`;
  const quotedCmd = ideaCmd.includes(' ') ? `"${ideaCmd}"` : ideaCmd;
  
  exec(`${quotedCmd} ${quotedPath}`, (error) => {
    if (error) {
      vscode.window.showErrorMessage(`打开 IntelliJ IDEA 失败: ${error.message}`);
    } else {
      vscode.window.showInformationMessage('已在 IntelliJ IDEA 中打开文件');
    }
  });
}

// ========== GNU Global 相关功能 ==========

/**
 * 注册 GNU Global Providers
 * @param {vscode.ExtensionContext} context
 */
function registerGlobalProviders(context) {
  // 注册定义提供者
  const definitionProvider = new ReusableDefinitionProvider(globalIntegration);
  context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: 'file' }, definitionProvider));

  // 注册引用提供者
  const referenceProvider = new ReusableReferenceProvider(globalIntegration);
  context.subscriptions.push(vscode.languages.registerReferenceProvider({ scheme: 'file' }, referenceProvider));

  // 注册文档符号提供者
  const documentSymbolProvider = new ReusableDocumentSymbolProvider(globalIntegration);
  context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ scheme: 'file' }, documentSymbolProvider));
}

/**
 * 更新 GNU Global 标签
 */
async function updateGlobalTags() {
  try {
    await globalIntegration.updateTags();
    vscode.window.showInformationMessage('GNU Global tags updated successfully');
  } catch (error) {
    if (error && error.code === 3) {
      const createDB = await vscode.window.showInformationMessage(
        'GNU Global database not found. Would you like to create it now?',
        'Create Database', 'Learn More'
      );

      if (createDB === 'Create Database') {
        try {
          await globalIntegration.createDatabase();
          vscode.window.showInformationMessage('GNU Global database created successfully in .vscode directory!');
        } catch (createError) {
          vscode.window.showErrorMessage(`Failed to create GNU Global database: ${createError.message}`);
        }
      } else if (createDB === 'Learn More') {
        vscode.env.openExternal(vscode.Uri.parse('https://www.gnu.org/software/global/globalhtml_toc.html'));
      }
    } else {
      vscode.window.showErrorMessage('Failed to update GNU Global tags: ' + error.message);
    }
  }
}

/**
 * 创建 GNU Global 数据库
 */
async function createGlobalDatabase() {
  try {
    await globalIntegration.createDatabase();
    vscode.window.showInformationMessage('GNU Global database created successfully in .vscode directory!');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create GNU Global database: ${error.message}`);
  }
}

/**
 * 查找符号定义
 */
async function findGlobalDefinition() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const wordRange = editor.document.getWordRangeAtPosition(editor.selection.start);
  if (!wordRange) return;

  const word = editor.document.getText(wordRange);
  if (!word) return;

  try {
    const results = await globalIntegration.findDefinition(word);
    if (results.length === 0) {
      vscode.window.showInformationMessage(`No definition found for symbol: ${word}`);
      return;
    }

    // 如果只有一个结果，直接跳转
    if (results.length === 1) {
      const result = results[0];
      const uri = vscode.Uri.file(result.path);
      const position = new vscode.Position(result.line, 0);
      await vscode.window.showTextDocument(uri, { selection: new vscode.Range(position, position) });
    } else {
      // 多个结果，显示快速选择
      const items = results.map(result => ({
        label: `${result.tag}`,
        description: `${result.path}:${result.line + 1}`,
        detail: result.info,
        result: result
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Multiple definitions found for ${word}, select one:`
      });

      if (selected) {
        const result = selected.result;
        const uri = vscode.Uri.file(result.path);
        const position = new vscode.Position(result.line, 0);
        await vscode.window.showTextDocument(uri, { selection: new vscode.Range(position, position) });
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage('Failed to find definition: ' + error.message);
  }
}

/**
 * 查找符号引用
 */
async function findGlobalReferences() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const wordRange = editor.document.getWordRangeAtPosition(editor.selection.start);
  if (!wordRange) return;

  const word = editor.document.getText(wordRange);
  if (!word) return;

  try {
    const results = await globalIntegration.findReferences(word);
    if (results.length === 0) {
      vscode.window.showInformationMessage(`No references found for symbol: ${word}`);
      return;
    }

    // 显示快速选择
    const items = results.map(result => ({
      label: `${result.tag}`,
      description: `${result.path}:${result.line + 1}`,
      detail: result.info,
      result: result
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `References for ${word}:`
    });

    if (selected) {
      const result = selected.result;
      const uri = vscode.Uri.file(result.path);
      const position = new vscode.Position(result.line, 0);
      await vscode.window.showTextDocument(uri, { selection: new vscode.Range(position, position) });
    }
  } catch (error) {
    vscode.window.showErrorMessage('Failed to find references: ' + error.message);
  }
}

module.exports = {
  convertjson,
  convertgosturct,
  b64encode,
  b64decode,
  currentTimestamp,
  parseTimestamp,
  formatTimestamp,
  urlencode,
  urldecode,
  toTop,
  toBottom,
  toCenter,
  exceltojson,
  jsontoexcel,
  openInIdea,
  // GNU Global
  registerGlobalProviders,
  updateGlobalTags,
  createGlobalDatabase,
  findGlobalDefinition,
  findGlobalReferences,
}