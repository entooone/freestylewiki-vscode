# Change Log

## 0.8.1 - 2023/08/01

- テーブルの左寄せをした際に末尾スペースを挿入しないように修正 [#23](https://github.com/entooone/freestylewiki-vscode/issues/23) [28b9be0](https://github.com/entooone/freestylewiki-vscode/commit/28b9be06baca1f587d11d746169206f03fcabe72) 

## 0.8.0 - 2023/08/01

- テーブル整形に関するオプションの追加 [55e6597](https://github.com/entooone/freestylewiki-vscode/commit/55e659763c119ddb339e1f95e0809ffb56102f3e)
    - `freeStyleWiki.formatTableAlignOption`: テーブルの整形における文字の揃え方をしていします。
    - `freeStyleWiki.formatTableCellSuffixSpace`: テーブルの整形時、各セルの末尾にスペースを追加するかどうかを設定します。
- テーブル整形のデフォルト値を変更
    - `freeStyleWiki.formatTableAlignOption`: `right` から `left` に変更
    - `freeStyleWiki.formatTableCellSuffixSpace`: `false` から `true` に変更

## 0.7.0 - 2023/07/27

- 見出しを折りたたむとき最終行が空行なら残すように修正 [77c9942](https://github.com/entooone/freestylewiki-vscode/commit/77c99421bcaacc88c4d6c290807329217ae4d478)

## 0.6.0 - 2023/07/27

- コメントアウトのシンタックスハイライトの追加 [60b7537](https://github.com/entooone/freestylewiki-vscode/commit/60b75377207cc4a6b4e58cba9613c078d205e7a9)
- 見出し、ブロックプラグインの展開、折りたたみ機能の追加 [727095d](https://github.com/entooone/freestylewiki-vscode/commit/727095d67ab9d22179c20f0f107032344ad3ba44)
- ブロックプラグイン中に見出しの表記 (e.g. `!!! 見出し` ) があるとき、アウトラインに追加されてしまう問題を修正 [57986ed](https://github.com/entooone/freestylewiki-vscode/commit/57986ed58270f338fdcf4ead6973920d75a54ec9)

## 0.5.0 - 2021/11/07

- フォーマッタ機能の追加 [#17](https://github.com/entooone/freestylewiki-vscode/pull/17)

## 0.4.0 - 2020/12/19

- アウトラインがクラッシュしないように修正 [#12](https://github.com/entooone/freestylewiki-vscode/pull/12)
- シンタックスハイライトのルールを変更 [#14](https://github.com/entooone/freestylewiki-vscode/pull/14)

## 0.3.0 - 2020/12/17

- ソースコードを JavaScript から TypeScript に変更 [#8](https://github.com/entooone/freestylewiki-vscode/pull/8)

## 0.2.0 - 2020/07/11

- サポートする拡張子に `.fswiki` を追加

## 0.1.0 - 2020/02/07

- 初回リリース
