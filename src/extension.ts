// Copyright 2020 entooone
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as vscode from 'vscode';

class FSWDocumentsSymbolProvider {
    private readonly pattern = /(^!{1,3}) *(.+)$/gm
    private readonly tokenKind = 14

    private matchAll(text: string): RegExpExecArray[] {
        const out: RegExpExecArray[] = [];
        this.pattern.lastIndex = 0;
        let match: RegExpExecArray | null = null;
        while ((match = this.pattern.exec(text))) {
            out.push(match);
        }
        return out;
    }

    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentSymbol[] {
        const text = document.getText();
        const matchedList = this.matchAll(text);
        const symbols: vscode.DocumentSymbol[] = [];
        matchedList.map((matched) => {
            const type = matched[1];
            const name = matched[2];
            const kind = this.tokenKind;
            const pos = document.positionAt(matched.index || 0);
            const line = document.lineAt(pos.line);
            const symbol = new vscode.DocumentSymbol(
                name,
                'L' + (pos.line + 1),
                kind,
                line.range,
                line.range
            );
            symbol.children = [];
            if (type == "!!!") {
                symbols.push(symbol);
            } else if (type == "!!") {
                const parent = symbols[symbols.length - 1];
                parent.children.push(symbol);
            } else if (type == "!") {
                let parent = symbols[symbols.length - 1];
                parent = parent.children[parent.children.length - 1];
                parent.children.push(symbol);
            }
        });

        return symbols;
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            [
                { language: 'fsw', pattern: '**/*.fsw' },
                { language: 'fsw', scheme: 'file' },
            ],
            new FSWDocumentsSymbolProvider(),
        )
    );
}
