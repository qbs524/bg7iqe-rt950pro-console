# Ferrite Console 中文版（网页托管）

Ferrite Console 的中文界面构建，纯静态托管。浏览器打开即可用：

**https://qbs524.github.io/ferrite-console-zh/**

## 能做什么

- 用写频线（Web Serial）连接电台，读写信道、区域、设置
- 安装 / 更新固件（自己的 `.ffw` 也可以，勾选「允许未签名文件」）
- APRS 消息与听到的台站、卫星跟踪、SSTV 图片、事件日志、终端
- 实时显示电台屏幕并远程按键（不发射：这里没有 PTT）

## 浏览器要求

| 系统 | 浏览器 |
|---|---|
| Windows 10 / 11 | 新版 Chrome 或 Edge |
| Windows 7 | Chrome 109 或 Edge 109（最后支持 Win7 的版本） |
| macOS / Linux | Chrome、Edge 或其它 Chromium 内核浏览器 |

写频线用的是 **Web Serial**，浏览器只在 **HTTPS** 或 **localhost** 下开放它。GitHub Pages 是 HTTPS，
所以直接打开本页就能连电台；Firefox 和 Safari 不支持 Web Serial。

自检：按 F12，在 Console 里输入 `"serial" in navigator`，应返回 `true`。

## 用法

1. 打开上面的网址（建议用 Chrome / Edge）。
2. 写频线插好，装好 USB 串口驱动（CH340 / CP210x / FTDI）。
3. 点「用写频线连接」，在弹出的列表里选电台的 COM 口。
4. 读信道 → 改 → 写入电台。中文信道名最多 7 个汉字。

## 刷自己的固件

Update 页 → 选择本地 `.ffw` → 勾选 **Allow unsigned files**（允许未签名文件）。
配套的中文固件在本地保存为 `ferrite-zh-tx.ffw`。

## 中英文切换

右下角 **EN / 中** 按钮；或在地址后加 `?lang=en` / `?lang=zh`。选择记在浏览器里。

改词表：编辑仓库里的 `zh-dict.js`（`"英文":"中文"`，一行一条），提交后刷新即可，不需要重新构建。

## 这个仓库是什么

- 官方 Ferrite Console v0.9.6 的同源构建（同一份 `ferrite-core`，编译为 WebAssembly）
- 加了两处本地补丁：
  1. 中文信道名 / 区域名：写入 `0x01 + GB2312`（最多 7 个汉字），读回自动解码
  2. 中文界面层：`zh.js`（运行时翻译，只做整串匹配）+ `zh-dict.js`（词表，866 条）
- 构建时用了相对路径（`base: './'`），所以放在 `用户名.github.io/仓库名/` 这种子路径下也能正常工作

固件与本地工具不在这个仓库里。

## 已知无害

浏览器控制台会有一条 404：`/firmware/manifest.json`。这份构建没有内置固件版本清单，
不影响读写电台；官方托管版才有那份清单。

## 许可

Ferrite Console 为上游项目，遵循其原许可证（见 `THIRD-PARTY-LICENSES.md`）。
中文界面层与中文信道名补丁为本地改动。
