const { app, BrowserWindow, ipcMain, dialog, screen, shell } = require('electron')
const url = require("url");
const fs = require("fs");
const path = require("path");
const cp = require('child_process');
const legacy = require('legacy-encoding');
const SingleInstance = require('single-instance');

const locker = new SingleInstance('ae-graphytica');
locker.lock().then(() => {
	let win; let rendererReadyToClose = false;

	var log_file = fs.createWriteStream(path.join(__dirname, 'debug.log'), {flags: 'w'});
	console._log = console.log;
	console.log = function(o) {
		log_file.write((new Date().toISOString().substr(11, 8)) + ':\t' + (typeof o == 'object' ? JSON.stringify(o) : o) + '\n');
		console._log(...arguments);
	};
	console.log(`Graphytica log file ${new Date()}\n\n`)

	let cmdCodePage = 866;
	if (process.platform == 'win32') {
		let chcpReply = cp.execSync('chcp').toString('utf-8');
		let matches = chcpReply.match(/\d+/);
		cmdCodePage = parseInt(matches[0])
	}
	function bufferToString(buffer) {
		if (process.platform == 'win32') {
			return legacy.decode(buffer, cmdCodePage)
		} else {
			return buffer.toString('utf-8')
		}
	}

	function kill() {
		console.log('Graphytica INFO: Trying to force-quit. Check for critical errors in log above.')
		process.exit(-1);
	}

	process.on('SIGINT', kill);
	
	function createWindow() {
		let pidSplashScreen = parseInt(process.argv[1]);
		if (pidSplashScreen) {
			process.kill(pidSplashScreen);
			console.log(`terminated ${pidSplashScreen}`);
		}

		if (!win) {
			let initialWidth = 800, initialHeight = 600
			let {width, height} = screen.getPrimaryDisplay().size
			let x = Math.floor((width - initialWidth)/2)
			let y = Math.floor((height - initialHeight)/2)

			win = new BrowserWindow({
				webPreferences: {
					enableRemoteModule: true,
					nodeIntegration: true
				},
				width: initialWidth,
				height: initialHeight,
				backgroundColor: '#ffffff',
				icon: path.join(__dirname, 'dist/favicon.png')
			})
			win.setResizable(false)

			win.webContents.on('will-navigate', (e, url) => {
				if (url !== e.sender.getURL()) {
					e.preventDefault()
				}
			})

			ipcMain.on('fixed-size', (event, arg) => {
				if (process.platform == 'linux') {
					win.setResizable(true)
					win.unmaximize();
					win.setSize(initialWidth,initialHeight);
					win.setPosition(x,y)
					win.setResizable(false)
				} else if (process.platform == 'win32') {
					win.unmaximize();
					win.setSize(initialWidth,initialHeight);
				}
			})

			ipcMain.on('full-size', (event, arg) => {
				if (process.platform == 'linux') {
					win.setResizable(true)
					win.setSize(width,height)
					win.maximize()
					win.setResizable(false)
				} else if (process.platform == 'win32') {
					win.maximize()
				}
			})
		
			ipcMain.on('has-unsaved-changes', (event, hasUnsaved) => {
				if (hasUnsaved == 'not_ready') return;
				const choice = dialog.showMessageBoxSync(win, {
					type: 'question',
					buttons: ['No', 'Yes'],
					title: hasUnsaved ? 'Есть несохраненные изменения!' : 'Выход',
					message: 'Вы уверены, что хотите выйти?' + (hasUnsaved ? '\nЕсть несохраненные изменения!' : '')
				});
				if (choice === 1) {
					win.webContents.send('quit-request', null);
				}
			});

			win.on('close', function(e) {
				//rendererReadyToClose can be true only if 'quit-request' returned true
				if (!rendererReadyToClose) {
					e.preventDefault();
					win.webContents.send('has-unsaved-changes', null);
				}
			});
		
			win.setMenuBarVisibility(false)
			win.loadURL(
				url.format({
					pathname: path.join(__dirname, `dist/index.html`),
					protocol: "file:",
					slashes: true
				})
			);
		
			win.webContents.openDevTools()
		
			win.on('closed', function() {
				win = null
			})
		}
	}

	ipcMain.on('quit-request', (event, ready) => {
		rendererReadyToClose = ready;
		win.close();
		//then window-all-closed fires automatically
	});

	ipcMain.on('external-docs', (event, target) => {
		let url = ''
		switch (target) {
			case 'csv': url = 'https://csv.js.org/parse/options/'; break;
			case 'ecmascript': url = 'https://262.ecma-international.org/6.0/'; break;
		}
		shell.openExternal(url)
	});
	
	app.on('window-all-closed', function() {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('ready', () => {
		// argument[1] when started by launcher as e.g. 'ae-graphytica.exe 9044'. When started by npm 'electron .',
		// argument[1] is . , and no pid is passed at all
		let pidSplashScreen = parseInt(process.argv[1]);
		if (pidSplashScreen) {
			process.kill(pidSplashScreen);
			console.log(`terminated ${pidSplashScreen}`);
		}
		createWindow()
	})
	
	app.on('activate', function() {
		if (win === null) {
			createWindow()
		}
	})
}).catch(err => {
    // This block will be executed if the app is already running
    console.log(err); // it will print out 'An application is already running'
});