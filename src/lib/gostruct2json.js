

const typeMap = {
  'string': "string",
  'int': 1,
}

// parse golang struct type and generate example json
function gostruct2json(struct) {
  lines = struct.split("\n")
  var res = {}
  for (var i = 0; i < lines.length - 1; i++) {
    line = lines[i]
    if (i == 0) {
      if (!lines[i].includes("struct")) {
        throw 'invalid struct'
      }
    } else {
      tag = line.match(/json:"(.+)"/)
      if (tag == null || tag.length < 2) {
        continue
      }
      var tagName = tag[1]
      var tagTypeGroup = line.match(/((\[\])*)(\w+)\s+\`/)
      var tagType = null
      var tagValue = null
      if (tagTypeGroup == null || tagTypeGroup.length < 2) {
        console.log("can't get type of: " + line)
      } else {
        tagType = tagTypeGroup[3]
        if (tagType.startsWith("int")) {
          tagType = "int"
        }
        arrayCount = tagTypeGroup[1].split('[]').length - 1
        tagValue = typeMap[tagType]
        if (tagValue == undefined) {
          tagValue = null
        }
        for(var j = 0; j < arrayCount; j ++ ) {
          tagValue = wrapArray(tagValue)
        }
      }
      res[tagName] = tagValue
    }
  }
  return JSON.stringify(res)
}

function wrapArray(el) {
  return [el]
}

module.exports = {
  gostruct2json
}