import * as vscode from 'vscode';
import * as fs from 'fs';

export class StoryVirtualDocumentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this._onDidChange.event;

    private cache = new Map<string, string>(); // partial content per URI

    provideTextDocumentContent(uri: vscode.Uri): string {
        // return what we have so far
        return this.cache.get(uri.toString()) ?? "";
    }

    async loadFromFile(realPath: vscode.Uri, virtualUri: vscode.Uri, chunkSize = 128 * 1024, delayMS = 50) {
        // ensure empty initial cache
        this.cache.set(virtualUri.toString(), "");

        return new Promise<void>((resolve, reject) => {
            // Node readable stream
            const stream = fs.createReadStream(realPath.fsPath, { encoding: 'utf8', highWaterMark: chunkSize });

            stream.on('data', async (chunk : string | Buffer) => {
                stream.pause();
                const textChunk = chunk instanceof Buffer ? chunk.toString('utf8') : chunk;
                const prev = this.cache.get(virtualUri.toString()) ?? "";
                this.cache.set(virtualUri.toString(), prev + textChunk);

                // notify VS Code that the document changed
                this._onDidChange.fire(virtualUri);

                await new Promise(res => setTimeout(res, delayMS));
                stream.resume();
            });

            stream.on('end', () => resolve());
            stream.on('error', (err) => reject(err));
        });
    }

    //clear cached document
    clear(uri: vscode.Uri) {
        this.cache.delete(uri.toString());
        this._onDidChange.fire(uri);
    }
}