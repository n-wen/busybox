// totype: 0 object， 1 array
function exceltojson(totype, content) {
	var splitchar = /\t/;
	var txt = content;
	if (!txt.trim()) {
		console.log("trim error")
		return { success: false };
	}
	var datas = txt.split("\n");
	var html = "[\n";
	var keys = [];
	for (var i = 0; i < datas.length; i++) {
		var ds = datas[i].split(splitchar);
		if (i == 0) {
			if (totype == "0") {
				keys = ds;
			} else {
				html += "[";
				for (var j = 0; j < ds.length; j++) {
					html += '"' + ds[j] + '"';
					if (j < ds.length - 1) {
						html += ",";
					}
				}
				html += "],\n";
			}
		} else {
			if (ds.length == 0) continue;
			if (ds.length == 1) {
				ds[0] == "";
				continue;
			}
			html += totype == "0" ? "{" : "[";
			for (var j = 0; j < ds.length; j++) {
				var d = ds[j];
				if (d == "") continue;
				if (totype == "0") {
					html += '"' + keys[j] + '":"' + d + '"';
				} else {
					html += '"' + d + '"';
				}
				if (j < ds.length - 1) {
					html += ',';
				}
			}
			html += totype == "0" ? "}" : "]";
			if (i < datas.length - 1)
				html += ",\n";
		}
	}
	if (html && html.lastIndexOf(",\n") == html.length - 2) {
		html = html.substring(0, html.lastIndexOf(",\n"));
	}
	html += "\n]";
	return { success: true, content: html };
}

function jsontoexcel(content) {
	var fgf = "\t";
	var instr = content;
	var jsons = JSON.parse(instr);
	if (jsons.length < 1) {
		return { success: false };
	}
	var titles = new Array();
	for (var key in jsons[0]) {
		titles.push(key);
	}

	var values = new Array();
	for (var i = 0, l = jsons.length; i < l; i++) {
		var value = new Array();
		for (var key in jsons[i]) {

			value.push(jsons[i][key]);
		}
		values.push(value);
	}

	var html = '';
	html += titles.join(fgf) + "\n"
	for (var i = 0; i < values.length; i++) {
		html += values[i].join(fgf) + "\n";
	}
	return { success: true, content: html };
}

// CSV conversion functions
function excelToCsv(content) {
	var splitchar = /\t/;
	var txt = content;
	if (!txt.trim()) {
		return { success: false };
	}
	var datas = txt.split("\n");
	var csv = "";

	for (var i = 0; i < datas.length; i++) {
		var ds = datas[i].split(splitchar);
		for (var j = 0; j < ds.length; j++) {
			var d = ds[j];
			// CSV 转义：如果包含逗号、双引号或换行符，需要用双引号包围
			// 双引号需要转义为两个双引号
			if (d.includes(',') || d.includes('"') || d.includes('\n')) {
				d = '"' + d.replace(/"/g, '""') + '"';
			}
			csv += d;
			if (j < ds.length - 1) {
				csv += ",";
			}
		}
		if (i < datas.length - 1) {
			csv += "\n";
		}
	}
	return { success: true, content: csv };
}

function csvToJson(content) {
	var txt = content;
	if (!txt.trim()) {
		return { success: false };
	}
	var lines = txt.split("\n");
	var csv = "[\n";
	var keys = [];

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (!line.trim()) continue;

		// 解析 CSV 行
		var ds = parseCsvLine(line);

		if (i == 0) {
			keys = ds;
		} else {
			csv += "{";
			for (var j = 0; j < ds.length; j++) {
				csv += '"' + keys[j] + '":"' + ds[j] + '"';
				if (j < ds.length - 1) {
					csv += ",";
				}
			}
			csv += "}";
			if (i < lines.length - 1) {
				csv += ",\n";
			}
		}
	}
	if (csv && csv.lastIndexOf(",\n") == csv.length - 2) {
		csv = csv.substring(0, csv.lastIndexOf(",\n"));
	}
	csv += "\n]";
	return { success: true, content: csv };
}

function jsonToCsv(content) {
	var instr = content;
	var jsons = JSON.parse(instr);
	if (jsons.length < 1) {
		return { success: false };
	}
	var titles = new Array();
	for (var key in jsons[0]) {
		titles.push(key);
	}

	var csv = '';
	csv += titles.join(',') + "\n";

	for (var i = 0; i < jsons.length; i++) {
		var row = [];
		for (var key in jsons[i]) {
			var value = jsons[i][key];
			// CSV 转义
			if (value.includes(',') || value.includes('"') || value.includes('\n')) {
				value = '"' + value.replace(/"/g, '""') + '"';
			}
			row.push(value);
		}
		csv += row.join(',') + "\n";
	}
	return { success: true, content: csv };
}

function csv2excel(content) {
	var txt = content;
	if (!txt.trim()) {
		return { success: false };
	}
	var lines = txt.split("\n");
	var excel = "";

	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (!line.trim()) continue;

		// 解析 CSV 行
		var ds = parseCsvLine(line);

		// 用制表符连接
		excel += ds.join('\t');
		if (i < lines.length - 1) {
			excel += "\n";
		}
	}
	return { success: true, content: excel };
}

// CSV 行解析函数
function parseCsvLine(line) {
	var result = [];
	var current = "";
	var inQuotes = false;
	var i = 0;

	while (i < line.length) {
		var char = line[i];

		if (char === '"') {
			if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
				// 转义的双引号
				current += '"';
				i++; // 跳过下一个双引号
			} else {
				// 切换引号状态
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			// 逗号分隔符
			result.push(current);
			current = "";
		} else {
			current += char;
		}
		i++;
	}

	// 添加最后一个字段
	result.push(current);
	return result;
}

module.exports = {
	exceltojson,
	jsontoexcel,
	excelToCsv,
	csvToJson,
	jsonToCsv,
	csv2excel,
}