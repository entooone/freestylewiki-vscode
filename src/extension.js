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

"use strict";

const vscode = require('vscode');

let FSWDocumentsSymbolProvider = {};

FSWDocumentsSymbolProvider.tokenToKind = function() {
	const headingKind = 19
	return {
		"!!!": headingKind,
		"!!": headingKind,
		"!": headingKind,
	};
};

/**
 * @return {RegExp}
 */
FSWDocumentsSymbolProvider.pattern = function() {
	return /(^!{1,3}) *(.+)$/gm;
};

/**
 * @param {RegExp} pattern
 * @param {string} text
 * @return {RegExpExecArray}
 */
FSWDocumentsSymbolProvider.matchAll = function(pattern, text) {
	const out = [];
	pattern.lastIndex = 0;
	let match = null;
	while((match = pattern.exec(text))) {
		out.push(match);
	}
	return out;
};

/**
 * @param {vscode.TextDocument} document
 * @param {vscode.CancellationToken} token
 * @return {ProviderResult<SymbolInformation[] | DocumentSymbol[]>}
 */
FSWDocumentsSymbolProvider.provideDocumentSymbols = function(document, token) {
	const tokenToKind = this.tokenToKind();
	const text = document.getText();
	const matchedList = this.matchAll(this.pattern(), text)

	let symbols = [];
	matchedList.map((matched) => {
		const type = matched[1];
		const name = matched[2];
		const kind = tokenToKind[type];
		const pos = document.positionAt(matched.index || 0);
		const line = document.lineAt(pos.line);
		const symbol = new vscode.DocumentSymbol(
			name,
			pos.line + 1,
			kind,
			line.range,
			line.range
		);
		symbol.children = [];
		if (type == "!!!") {
			symbols.push(symbol);
		} else if (type == "!!") {
			const parent = symbols[symbols.length - 1]
			parent.children.push(symbol);
		} else if (type == "!") {
			let parent = symbols[symbols.length - 1]
			parent = parent.children[parent.children.length - 1];
			parent.children.push(symbol);
		}
	});
	
	return symbols;
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			[
				{ language: 'fsw', pattern: '**/*.fsw'},
				{ language: 'fsw', scheme: 'file'},
			],
			FSWDocumentsSymbolProvider
		)
	);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
