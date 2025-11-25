import * as vscode from 'vscode';

const borderColor = new vscode.ThemeColor('editor.wordHighlightBorder');

export const highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.wordHighlightBackground'),
    border: `1px solid ${new vscode.ThemeColor('editor.wordHighlightBorder')}`
});