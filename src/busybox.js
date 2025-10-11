const json2go = require("./lib/json2go")
const gostruct2json = require("./lib/gostruct2json")
const excel = require("./lib/excel")
const vscode = require("vscode")
const { exec } = require("child_process")

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
  // 使用 child_process 直接执行命令，无需显示终端
  const quotedPath = `"${currentFilePath}"`;
  exec(`idea64 ${quotedPath}`, (error) => {
    if (error) {
      vscode.window.showErrorMessage(`打开 IntelliJ IDEA 失败: ${error.message}`);
    } else {
      vscode.window.showInformationMessage('已在 IntelliJ IDEA 中打开文件');
    }
  });
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
}