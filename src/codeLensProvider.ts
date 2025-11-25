import * as vscode from 'vscode';
import { highlightDecoration } from './decorations';

export class PageNumberCodeLensProvider implements vscode.CodeLensProvider {
    private regex = /\bat line (\d+)\b/gi;
    private offsets = new Map<string, number>();

    constructor(private storyEditor: vscode.TextEditor | null) {}

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        
        if (!document.fileName.endsWith('.log')) {
            return []; // skip .div files
        }
        
        const codeLenses: vscode.CodeLens[] = [];
        const decorations: vscode.DecorationOptions[] = [];
    
      // Only scan from last offset for incremental updates
        const lastOffset = this.offsets.get(document.uri.toString()) ?? 0;
        const text = document.getText().slice(lastOffset);

        let match;
        while ((match = this.regex.exec(text)) !== null) {
            const start = document.positionAt(match.index + lastOffset);
            const end = document.positionAt(match.index + lastOffset + match[0].length);
            const range = new vscode.Range(start, end);

            codeLenses.push(new vscode.CodeLens(range, {
                title: 'Go to story line',
                command: 'storytime.goToStoryLine',
                arguments: [parseInt(match[1], 10), this.storyEditor]
            }));

            decorations.push({ range });
        }

         // Update offset
        this.offsets.set(document.uri.toString(), document.getText().length);

        // Apply decorations
        if (vscode.window.activeTextEditor) {
            vscode.window.activeTextEditor.setDecorations(highlightDecoration, decorations);
        }

        return codeLenses;
    }
    
    reset(document: vscode.TextDocument) {
        this.offsets.set(document.uri.toString(), 0);
    }
}