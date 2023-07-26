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

import { rejects } from 'assert';
import { resolve } from 'path/posix';
import "./polyfill/crypto";
import * as vscode from 'vscode';
import * as fs from 'fs';
import "./wasm_exec";

declare const WebAssembly: any;
declare const Go: any;
declare const GoFSWiki: any;

const go = new Go();
let mod: any, inst: any;

async function loadGOWasm(extensionUri: vscode.Uri) {
	const wasmPath = vscode.Uri.joinPath(extensionUri, 'static', 'wasm.wasm').fsPath;
	mod = await WebAssembly.compile(fs.readFileSync(wasmPath));
	inst = await WebAssembly.instantiate(mod, go.importObject);
	go.run(inst);
}

async function formatDocument(s: string): Promise<string> {
	try {
		return GoFSWiki.formatDocument(s);
	} catch (e) {
		inst = await WebAssembly.instantiate(mod, go.importObject);
		go.run(inst);
		return GoFSWiki.formatDocument(s);
	}
}

class FSWDocumentsSymbolProvider implements vscode.DocumentSymbolProvider {
	private readonly pattern = /(^!{1,3}) *(.+)$/gm;
	private readonly tokenKind = 14;

	private matchAll(text: string): RegExpExecArray[] {
		const out: RegExpExecArray[] = [];
		this.pattern.lastIndex = 0;
		let match: RegExpExecArray | null = null;
		while ((match = this.pattern.exec(text))) {
			out.push(match);
		}
		return out;
	}

	public provideDocumentSymbols(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.DocumentSymbol[] {
		const text = document.getText();
		const matchedList = this.matchAll(text);
		const symbols: vscode.DocumentSymbol[] = [];
		let h1: vscode.DocumentSymbol | null = null;
		let h2: vscode.DocumentSymbol | null = null;
		let h3: vscode.DocumentSymbol | null = null;
		matchedList.map((matched) => {
			const type = matched[1];
			const name = matched[2];
			const kind = this.tokenKind;
			const pos = document.positionAt(matched.index || 0);
			const line = document.lineAt(pos.line);
			const symbol = new vscode.DocumentSymbol(
				`${type} ${name}`,
				`L${pos.line + 1}`,
				kind,
				line.range,
				line.range
			);
			symbol.children = [];
			switch (type) {
				case "!!!":
					h1 = symbol;
					symbols.push(h1);
					break;
				case "!!":
					h2 = symbol;
					if (h1 !== null) {
						h1.children.push(h2);
					} else {
						symbols.push(h2);
					}
					break;
				case "!":
					h3 = symbol;
					if (h1 !== null && h2 !== null) {
						const parent = h1.range.start.line > h2.range.start.line ? h1 : h2;
						parent.children.push(h3);
					} else if (h1 !== null) {
						h1.children.push(h3);
					} else if (h2 !== null) {
						h2.children.push(h3);
					} else {
						symbols.push(h3);
					}
			}
		});
		return symbols;
	}
}

class FSWDocumentFormatter implements vscode.DocumentFormattingEditProvider {
	public provideDocumentFormattingEdits(document: vscode.TextDocument): Thenable<vscode.TextEdit[]> {
		return new Promise<vscode.TextEdit[]>((resolve, rejects) => {
			formatDocument(document.getText()).then(result => {
				const fileStart = new vscode.Position(0, 0);
				const fileEnd = document.lineAt(document.lineCount - 1).range.end;
				const textEdits: vscode.TextEdit[] = [
					new vscode.TextEdit(new vscode.Range(fileStart, fileEnd), result),
				];

				return resolve(textEdits);
			}).catch(e => {
				rejects(e);
			});
		});
	}
}

class FSWFoldingRangeProvider implements vscode.FoldingRangeProvider {
	public provideFoldingRanges(document: vscode.TextDocument, _context: vscode.FoldingContext, _token: vscode.CancellationToken): vscode.FoldingRange[] {
		let ranges: vscode.FoldingRange[] = [];
		let startLines: (number | undefined)[] = [];

		// Patterns
		const patterns = [
			{ regex: /^!!!.+/gm, level: 1 },
			{ regex: /^!![^!].+/gm, level: 2 },
			{ regex: /^![^!].+/gm, level: 3 },
			{ regex: /^{{[^}]+$/gm, level: -1, isBlockStart: true },
			{ regex: /^}}$/gm, level: -1, isBlockEnd: true }
		]
		const maxLevel = Math.max(...patterns.map(p => p.level));

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);

			for (const pattern of patterns) {
				if (line.text.match(pattern.regex)) {
					const startLine = startLines[pattern.level];
					if (pattern.isBlockStart) {
						startLines[pattern.level] = i;
					} else if (pattern.isBlockEnd) {
						if (startLine !== undefined) {
							ranges.push(new vscode.FoldingRange(startLine, i));
							startLines[pattern.level] = undefined;
						}
					} else if (startLines[-1] === undefined) { // not in block
						if (startLine !== undefined) {
							ranges.push(new vscode.FoldingRange(startLine, i - 1));
						}
						startLines[pattern.level] = i;
						for (let j = pattern.level + 1; j <= maxLevel; j++) {
							const highLevelStartLine = startLines[j];
							if (highLevelStartLine !== undefined) {
								ranges.push(new vscode.FoldingRange(highLevelStartLine, i - 1));
								startLines[j] = undefined;
							}
						}
					}
				}
			}
		}

		for (let i = 0; i < startLines.length; i++) {
			const startLine = startLines[i];
			if (startLine !== undefined) {
				ranges.push(new vscode.FoldingRange(startLine, document.lineCount - 1));
			}
		}

		return ranges;
	}
}

export async function activate(context: vscode.ExtensionContext) {
	const fswSelector = [
		{ language: 'fsw', pattern: '**/*.fsw' },
		{ language: 'fsw', scheme: 'file' },
	];

	await loadGOWasm(context.extensionUri);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			fswSelector, new FSWDocumentsSymbolProvider(),
		)
	);
	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(
			fswSelector, new FSWDocumentFormatter())
	);
	context.subscriptions.push(
		vscode.languages.registerFoldingRangeProvider(
			fswSelector, new FSWFoldingRangeProvider(),
		)
	);
}
