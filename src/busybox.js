const json2go = require("./lib/json2go")
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

module.exports = {
  convertjson
}