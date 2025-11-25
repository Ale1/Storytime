//'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

import { PageNumberCodeLensProvider } from './codeLensProvider';
import { StoryVirtualDocumentProvider } from './virtualDocumentProvider';

const storyVirtualProvider = new StoryVirtualDocumentProvider();
vscode.workspace.registerTextDocumentContentProvider("storytime", storyVirtualProvider);

let storyLog: vscode.TextEditor | null = null;

export function activate(context: vscode.ExtensionContext) {

	//#region COMMAND 1 : OPEN TWO FILES

const openFilesCommand = vscode.commands.registerCommand('storytime.openfiles', async () => {
    const choice = await vscode.window.showQuickPick(
        ['Select two files', 'Select folder containing two files'],
        { placeHolder: 'How would you like to open the story files?' }
    );
    if (!choice) {return;};

    let files: vscode.Uri[] | undefined;

    if (choice === 'Select folder containing two files') {
        const folderUris = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Folder containing your story files'
        });
        if (!folderUris || folderUris.length === 0) {return;};

        const folderUri = folderUris[0];
        const allFiles = await vscode.workspace.fs.readDirectory(folderUri);
        const txtFiles = allFiles.filter(([name, type]) =>
            type === vscode.FileType.File && (name.endsWith('.log') || name.endsWith('.div'))
        );

        if (txtFiles.length < 2) {
            vscode.window.showErrorMessage('The selected folder does not contain enough story files.');
            return;
        }

        files = txtFiles.slice(0, 2).map(([name]) => vscode.Uri.joinPath(folderUri, name));

    } else {
        files = await vscode.window.showOpenDialog({
            canSelectMany: true,
            openLabel: 'Select Story Log and Story File',
            filters: { 'Text files': ['div', 'log'] }
        });
    }

    if (!files || files.length !== 2) {
        vscode.window.showErrorMessage('Please select exactly two files.');
        return;
    }

    const [fileA, fileB] = files;

    const divFile = fileA.path.endsWith('.div') ? fileA : fileB;
    const logFile = fileA.path.endsWith('.log') ? fileA : fileB;

    // create virtual URI
    const virtualDivUri = vscode.Uri.parse(`storytime:${divFile.fsPath}`);
	const virtualLogUri = vscode.Uri.parse(`storytime:${logFile.fsPath}`);


    // load file into virtual provider
	storyVirtualProvider.loadFromFile(divFile, virtualDivUri);
    storyVirtualProvider.loadFromFile(logFile, virtualLogUri);

    // open real log and virtual .div 
    const divDoc = await vscode.workspace.openTextDocument(virtualDivUri);
    const logDoc = await vscode.workspace.openTextDocument(virtualLogUri);



    const editor1 = await vscode.window.showTextDocument(divDoc, {
        viewColumn: vscode.ViewColumn.One,
        preview: false
    });

     const editor2 = await vscode.window.showTextDocument(logDoc, {
        viewColumn: vscode.ViewColumn.Two,
        preview: false
    });

	console.log(logDoc.uri.scheme, logDoc.languageId);

    storyLog = editor2;

    const provider = new PageNumberCodeLensProvider(storyLog);
    vscode.languages.registerCodeLensProvider( { scheme: "storytime", language: "log" }, provider);

    storyVirtualProvider.onDidChange(uri => {
		const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
		if (doc) {
			provider.refresh();
		}
    });
});
	//#endregion


	
    //#region COMMAND 2 : GO TO STORY LINE
    const goToStoryLineCommand = vscode.commands.registerCommand('storytime.goToStoryLine',
        (lineNumber: number, editor: vscode.TextEditor | null) => {
            if (!editor) {return;};
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
