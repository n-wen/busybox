# busybox README

**Toolkits for VSCode**

I think there is no need to open too many tabs of JSON online toolkits. 

This project aims to collect these tools and bring them to VSCode (now with others, like cursor, trace, etc.).

## Features
type `ctrl+p` (or `cmd+p` in macos) to open command pallate,
input `busybox` to show all related command.

![](./asset/busybox.png)


- Convert json to go struct

![](./asset/jsontogo.gif)

- Generate json from go struct, put result to clipboard.

![](./asset/gotojson.gif)

- Encode / Decode base64 text
- Get Current Timestamp, format timestamp to ISOString, parse Datetime string to Timestamp
- url encode/decode
- center editor window like emacs use `ctrl+L`
- Conversion for json and excel
- Open file in your idea
If idea64.exe not in your path, consider add following configuration:
```json
{
  "busybox.idea.cmd.path": "idea"
}
```

## TODO

- http request client

**Contributing**

Contributions are welcome. To test and run this extension, please refer to [vscode](https://github.com/microsoft/vscode) extension developing docs.

Feel free to submit issues or feature requests on [github](https://github.com/n-wen/busybox).

## **License**

Licensed under the MIT license.

