# FreeStyleWiki for Visual Studio Code

[![release](https://img.shields.io/github/actions/workflow/status/entooone/freestylewiki-vscode/release.yml?label=release)](https://github.com/entooone/freestylewiki-vscode/actions?query=workflow%3Arelease)
[![version](https://img.shields.io/vscode-marketplace/v/entooone.freestylewiki-extension.svg?style=flat&logo=visual%20studio%20code&label=vscode%20marketplace)](https://marketplace.visualstudio.com/items?itemName=entooone.freestylewiki-extension)

[FreeStyleWiki](https://fswiki.osdn.jp/cgi-bin/wiki.cgi) 用の VS Code 拡張機能。

## インストール

[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=entooone.freestylewiki-extension) からインストールができます。

また、VS Code のコマンドパレットで以下を実行することでもインストールできます。

```
ext install entooone.freestylewiki-extension
```

## サポートする拡張子

- `*.fsw`
- `*.fswiki`

## 機能

FreeStyleWiki 形式のファイルに以下の機能が追加されます。

- シンタックスハイライト
- フォーマッター
- アウトライン

## 開発方法

1. このレポジトリをクローンして VS Code で開きます

```
git clone https://github.com/entooone/freestylewiki-vscode.git
cd freestylewiki-vscode
code .
```

2. `npm install` で依存環境をインストールします

```
npm install
```

3. `./lib` 以下の Go 言語のプログラムを Wasm にコンパイルします

```
(cd ./lib/wasm && GOOS=js GOARCH=wasm go build  -o ../../static/wasm.wasm)
```

4. TypeScript のプログラムをコンパイルします

```
npm run compile
```

5. `F5` でデバック実行します

## 参考

- [Help - FreeStyleWiki](https://fswiki.osdn.jp/cgi-bin/wiki.cgi?page=Help)
