import * as vscode from 'vscode';
import { highlightDecoration } from './decorations';

export class PageNumberCodeLensProvider implements vscode.CodeLensProvider {
    private regex = /\bat line (\d+)\b/gi;

    private _onDidChange = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChange.event;

    constructor(private storyEditor: vscode.TextEditor | null) {}

    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        if (!document.uri.path.endsWith('.log')) {
            return [];
        }

        if (!this.storyEditor) {return [];};

        const codeLenses: vscode.CodeLens[] = [];
        const decorations: vscode.DecorationOptions[] = [];

        // Get the visible range(s) of the editor
        const visibleRanges = this.storyEditor.visibleRanges;
        for (const range of visibleRanges) {
            const startOffset = document.offsetAt(range.start);
            const endOffset = document.offsetAt(range.end);
            const text = document.getText().slice(startOffset, endOffset);

            let match;
            while ((match = this.regex.exec(text)) !== null) {
                const start = document.positionAt(match.index + startOffset);
                const end = document.positionAt(match.index + startOffset + match[0].length);
                const codeLensRange = new vscode.Range(start, end);

                codeLenses.push(new vscode.CodeLens(codeLensRange, {
                    title: 'Go to story line',
                    command: 'storytime.goToStoryLine',
                    arguments: [parseInt(match[1], 10), this.storyEditor]
                }));

                decorations.push({ range: codeLensRange });
            }
        }

        // Apply decorations
        if(this.storyEditor)
        {
            this.storyEditor.setDecorations(highlightDecoration, decorations);
        }

        return codeLenses;
    }

    private refreshTimeout: NodeJS.Timeout | undefined;
    public refresh() {
         if (this.refreshTimeout) {clearTimeout(this.refreshTimeout);};
        this.refreshTimeout = setTimeout(() => this._onDidChange.fire(), 100);
    }
}
