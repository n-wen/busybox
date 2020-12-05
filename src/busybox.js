const json2go = require("./lib/json2go")
const gostruct2json = require("./lib/gostruct2json")
const vscode = require("vscode")

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

  editor.edit(editorBuilder => {
    editorBuilder.replace(selection, res);
    vscode.window.showInformationMessage("Generate JSON Succeed!");
  });
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

module.exports = {
  convertjson,
  convertgosturct,
  b64encode,
  b64decode
}