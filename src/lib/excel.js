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

module.exports = {
	exceltojson,
	jsontoexcel,
}