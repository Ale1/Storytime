// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { highlightDecoration } from './decorations';
import { receiveMessageOnPort } from 'worker_threads';
import { PageNumberCodeLensProvider } from './codeLensProvider';

let storyEditor: vscode.TextEditor | null = null;

// Keep track of story/log files opened via extension
const openedFiles = new Set<string>();

// Store highlighted ranges globally so the selection listener can check them
let highlightedRanges: vscode.Range[] = [];


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "storytime" is now active!');

	//#region COMMAND 1 : OPEN TWO FILES
	const openFilesCommand = vscode.commands.registerCommand('storytime.openfiles', async() => {
	
		//step1 : prompt user for two story files
		const choice = await vscode.window.showQuickPick(
			['Select two files', 'Select folder containing two files'],
			{ placeHolder: 'How would you like to open the story files?' }
		);
		
		if (!choice) {return;} // User cancelled the quick pick
		
		let files: vscode.Uri[] | undefined;
		
		if (choice === 'Select folder containing two files') {
			const folderUris = await vscode.window.showOpenDialog({
				canSelectFolders: true,
				canSelectMany: false,
				openLabel: 'Select Folder contaning your story files'
			});
			if (!folderUris || folderUris.length === 0) {
				vscode.window.showErrorMessage('Please select a folder containing the story files.');
				return;
			}
			const folderUri = folderUris[0];
			const allFiles = await vscode.workspace.fs.readDirectory(folderUri);
			const txtFiles = allFiles.filter(([name, type]) => type === vscode.FileType.File && (name.endsWith('.txt') || name.endsWith('.story')));
			if (txtFiles.length < 2) {
				vscode.window.showErrorMessage('The selected folder does not contain enough story files.');
				return;
			}
			files = txtFiles.slice(0, 2).map(([name]) => vscode.Uri.joinPath(folderUri, name));
		} else {
			files = await vscode.window.showOpenDialog({
				canSelectMany: true,
				openLabel: 'Select Story Log and Story File',
				filters: {
					'Text files': ['txt', 'story']
				}
			});
		}

		if (!files || files.length !== 2) {
			vscode.window.showErrorMessage('Please select exactly two files: one story log and one story file.');
			return;
		}
			
		//open the selected files in the editor
		const editorOptions1: vscode.TextDocumentShowOptions = { viewColumn: vscode.ViewColumn.One, preview: false };
		const editorOptions2: vscode.TextDocumentShowOptions = { viewColumn: vscode.ViewColumn.Two, preview: false };

		const doc1	= await vscode.workspace.openTextDocument(files[0]);
		const doc2	= await vscode.workspace.openTextDocument(files[1]);
		const editor1 = await vscode.window.showTextDocument(doc1, editorOptions1);
		const editor2 = await vscode.window.showTextDocument(doc2, editorOptions2);

		// Identify story editor and register codelens
        storyEditor = [editor1, editor2].find(e => e.document.fileName.endsWith('.story')) || null;
        vscode.languages.registerCodeLensProvider(
            { scheme: 'file', language: 'plaintext' },
            new PageNumberCodeLensProvider(storyEditor)
        );

		// Track opened files
		openedFiles.clear();
		openedFiles.add(doc1.uri.toString());
		openedFiles.add(doc2.uri.toString());
		
	});
	//#endregion


    //#region COMMAND 2 : GO TO STORY LINE
    const goToStoryLineCommand = vscode.commands.registerCommand('storytime.goToStoryLine',
        (lineNumber: number, editor: vscode.TextEditor | null) => {
            if (!editor) {return};
            const line = editor.document.lineAt(lineNumber - 1);
            editor.revealRange(line.range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(line.range.start, line.range.start);
        }
    );
    //#endregion



	// ADD ALL COMMANDS
	context.subscriptions.push(openFilesCommand, goToStoryLineCommand);
}


// This method is called when your extension is deactivated
export function deactivate() {}
