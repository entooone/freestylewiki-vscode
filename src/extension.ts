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

import { rejects } from "assert";
import { resolve } from "path/posix";
import "./polyfill/crypto";
import * as vscode from "vscode";
import * as fs from "fs";
import "./wasm_exec";

declare const WebAssembly: any;
declare const Go: any;
declare const GoFSWiki: any;

const go = new Go();
let mod: any, inst: any;

async function loadGOWasm(extensionUri: vscode.Uri) {
	const wasmPath = vscode.Uri.joinPath(
		extensionUri,
		"static",
		"wasm.wasm",
	).fsPath;
	mod = await WebAssembly.compile(fs.readFileSync(wasmPath));
	inst = await WebAssembly.instantiate(mod, go.importObject);
	go.run(inst);
}

async function formatDocument(s: string): Promise<string> {
	const config = vscode.workspace.getConfiguration("freeStyleWiki");
	const option = {
		formatTableAlignOption: config.get<string>("formatTableAlignOption"),
		formatTableCellSuffixSpace: config.get<boolean>(
			"formatTableCellSuffixSpace",
		),
	};
	try {
		return GoFSWiki.formatDocument(s, option);
	} catch (e) {
		inst = await WebAssembly.instantiate(mod, go.importObject);
		go.run(inst);
		return GoFSWiki.formatDocument(s, option);
	}
}

class FSWDocumentsSymbolProvider implements vscode.DocumentSymbolProvider {
	public provideDocumentSymbols(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.DocumentSymbol[] {
		const symbols: vscode.DocumentSymbol[] = [];
		let isInBlock = false;
		const kind = 14;

		const patterns = [
			{ regex: /^!!!.+/gm, level: 1 }, // H1
			{ regex: /^!![^!].+/gm, level: 2 }, // H2
			{ regex: /^![^!].+/gm, level: 3 }, // H3
			{ regex: /^{{[^}]+$/gm, level: -1, isBlockStart: true }, // Block start
			{ regex: /^}}$/gm, level: -1, isBlockEnd: true }, // Block end
		];

		const headings: vscode.DocumentSymbol[] = [];

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);

			for (const pattern of patterns) {
				if (line.text.match(pattern.regex)) {
					if (pattern.isBlockStart) {
						isInBlock = true;
					} else if (pattern.isBlockEnd) {
						isInBlock = false;
					} else if (!isInBlock) {
						const symbol = new vscode.DocumentSymbol(
							line.text.trim(),
							`L${i + 1}`,
							kind,
							line.range,
							line.range,
						);

						headings[pattern.level] = symbol;
						const hs = headings
							.filter((h, i) => i < pattern.level && h !== undefined)
							.sort((a, b) => b.range.start.line - a.range.start.line);
						if (hs.length > 0) {
							hs[0].children.push(symbol);
						} else {
							symbols.push(symbol);
						}
					}
				}
			}
		}

		return symbols;
	}
}

class FSWDocumentFormatter implements vscode.DocumentFormattingEditProvider {
	public provideDocumentFormattingEdits(
		document: vscode.TextDocument,
	): Thenable<vscode.TextEdit[]> {
		return new Promise<vscode.TextEdit[]>((resolve, rejects) => {
			formatDocument(document.getText())
				.then((result) => {
					const fileStart = new vscode.Position(0, 0);
					const fileEnd = document.lineAt(document.lineCount - 1).range.end;
					const textEdits: vscode.TextEdit[] = [
						new vscode.TextEdit(new vscode.Range(fileStart, fileEnd), result),
					];

					return resolve(textEdits);
				})
				.catch((e) => {
					rejects(e);
				});
		});
	}
}

class FSWFoldingRangeProvider implements vscode.FoldingRangeProvider {
	private pushHeadingFoldingRange(
		document: vscode.TextDocument,
		ranges: vscode.FoldingRange[],
		startLine: number,
		endLine: number,
	) {
		const blankLinePattern = /^\s*$/gm;
		let end = endLine;
		// 最終行が空行の場合は、最終行を含めない
		if (end - 1 >= 0 && document.lineAt(endLine).text.match(blankLinePattern)) {
			end -= 1;
		}
		ranges.push(new vscode.FoldingRange(startLine, end));
	}

	public provideFoldingRanges(
		document: vscode.TextDocument,
		_context: vscode.FoldingContext,
		_token: vscode.CancellationToken,
	): vscode.FoldingRange[] {
		const ranges: vscode.FoldingRange[] = [];
		const startLines: (number | undefined)[] = [];

		const patterns = [
			{ regex: /^!!!.+/gm, level: 1 }, // H1
			{ regex: /^!![^!].+/gm, level: 2 }, // H2
			{ regex: /^![^!].+/gm, level: 3 }, // H3
			{ regex: /^{{[^}]+$/gm, level: -1, isBlockStart: true }, // Block start
			{ regex: /^}}$/gm, level: -1, isBlockEnd: true }, // Block end
		];
		const blankLinePattern = /^\s*$/gm;
		const maxLevel = Math.max(...patterns.map((p) => p.level));

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
					} else if (startLines[-1] === undefined) {
						// not in block
						if (startLine !== undefined) {
							this.pushHeadingFoldingRange(document, ranges, startLine, i - 1);
						}
						startLines[pattern.level] = i;
						for (let j = pattern.level + 1; j <= maxLevel; j++) {
							const highLevelStartLine = startLines[j];
							if (highLevelStartLine !== undefined) {
								this.pushHeadingFoldingRange(
									document,
									ranges,
									highLevelStartLine,
									i - 1,
								);
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
				this.pushHeadingFoldingRange(
					document,
					ranges,
					startLine,
					document.lineCount - 1,
				);
			}
		}

		return ranges;
	}
}

export async function activate(context: vscode.ExtensionContext) {
	const fswSelector = [
		{ language: "fsw", pattern: "**/*.fsw" },
		{ language: "fsw", scheme: "file" },
	];

	await loadGOWasm(context.extensionUri);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			fswSelector,
			new FSWDocumentsSymbolProvider(),
		),
	);
	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(
			fswSelector,
			new FSWDocumentFormatter(),
		),
	);
	context.subscriptions.push(
		vscode.languages.registerFoldingRangeProvider(
			fswSelector,
			new FSWFoldingRangeProvider(),
		),
	);
}
