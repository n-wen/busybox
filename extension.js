// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const busybox = require("./src/busybox");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "busybox" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let json2go = vscode.commands.registerCommand('busybox.json2go', function () {
		// The code you place here will be executed every time your command is executed

		// convert json to go struct
		busybox.convertjson();
	});
	context.subscriptions.push(json2go);

	let genjson = vscode.commands.registerCommand('busybox.genjson', function () {
		busybox.convertgosturct();
	})
	context.subscriptions.push(genjson)

	let base64encode = vscode.commands.registerCommand('busybox.b64encode', function () {
		busybox.b64encode();
	})
	context.subscriptions.push(base64encode);

	let base64decode = vscode.commands.registerCommand('busybox.b64decode', function () {
		busybox.b64decode();
	})
	context.subscriptions.push(base64decode);

	let currentTimestamp = vscode.commands.registerCommand('busybox.currentTimestamp', function () {
		busybox.currentTimestamp();
	})
	context.subscriptions.push(currentTimestamp);

	let formatTimestamp = vscode.commands.registerCommand('busybox.formatTimestamp', function () {
		busybox.formatTimestamp();
	})
	context.subscriptions.push(formatTimestamp);

	let parseTimestamp = vscode.commands.registerCommand('busybox.parseTimestamp', function () {
		busybox.parseTimestamp();
	})
	context.subscriptions.push(parseTimestamp);

	let urlencode = vscode.commands.registerCommand("busybox.urlencode", function () {
		busybox.urlencode();
	})
	context.subscriptions.push(urlencode);

	let urldecode = vscode.commands.registerCommand("busybox.urldecode", function () {
		busybox.urldecode();
	})
	context.subscriptions.push(urldecode);

	// center editor
	let centereditorState = "center";
	let timeout
	function reset() {
		if (timeout) clearTimeout(timeout);

		timeout = setTimeout(() => {
			state = "center";
		}, 1000);
	}

	// center editor
	vscode.window.onDidChangeActiveTextEditor(() => {
		clearTimeout(timeout);
		centereditorState = "center";
	});
	let centereditor = vscode.commands.registerCommand(
		"busybox.centereditor",
		() => {
			switch (centereditorState) {
				case "center":
					busybox.toCenter();
					centereditorState = "top";
					reset();
					break;
				case "top":
					busybox.toTop();
					centereditorState = "bottom";
					reset();
					break;
				case "bottom":
					busybox.toBottom();
					centereditorState = "center";
					reset();
					break;
			}
		}
	);
	context.subscriptions.push(centereditor);

	// excel and json convertion
	let exceltojson = vscode.commands.registerCommand('busybox.exceltojson', function () {
		busybox.exceltojson();
	})
	context.subscriptions.push(exceltojson)

	let jsontoexcel = vscode.commands.registerCommand('busybox.jsontoexcel', function () {
		busybox.jsontoexcel();
	})
	context.subscriptions.push(jsontoexcel)
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
