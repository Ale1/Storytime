import * as vscode from 'vscode';
import { highlightDecoration } from './decorations';

export class PageNumberCodeLensProvider implements vscode.CodeLensProvider {
    private regex = /\bat line (\d+)\b/gi;

    constructor(private storyEditor: vscode.TextEditor | null) {}

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        
        if (!document.fileName.endsWith('.txt')) {
            return []; // skip .story files
        }
        
        const codeLenses: vscode.CodeLens[] = [];
        const decorations: vscode.DecorationOptions[] = [];
        const text = document.getText();

        let match;
        while ((match = this.regex.exec(text)) !== null) {
            const start = document.positionAt(match.index);
            const end = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(start, end);

            // Add CodeLens
            codeLenses.push(new vscode.CodeLens(range, {
                title: 'Go to story line',
                command: 'storytime.goToStoryLine',
                arguments: [parseInt(match[1], 10), this.storyEditor]
            }));

            // Add inline decoration if you want it highlighted
            decorations.push({ range });
        }

        // Apply decoration to the active editor
        if (vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.setDecorations(highlightDecoration, decorations);
        }

        return codeLenses;
    }
}