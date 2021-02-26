const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const url = require("url");
const fs = require("fs");
const path = require("path");
const cp = require('child_process');
const net = require('net');
const temp = require('temp');
const SingleInstance = require('single-instance');
//const { trimSingleQuotes } = require('tslint/lib/utils');

const locker = new SingleInstance('ae-graphytica');
locker.lock().then(() => {
	let win; let rendererReadyToClose = false;
	
	function escapePathCom(filepath) {
		return '""'+filepath.replaceAll('\\', '\\\\')+'""';
	}

	function getEnv() {
		let environment = process.env;
		environment['ORIENTDB_HOME'] = path.join(__dirname, 'dist', 'orientdb-3.1.4');
		return environment;
	}
	
	function execShutdown() {
		//server.kill('SIGINT'), runWithEnv - оба способа НЕ РАБОТАЮТ, сервер НЕ ВЫРУБАЕТСЯ и блокирует папку dist
		//exec/execSync - единственные могут его остановить
		//даже вручную из cmd его не вырубишь, ему надо переменную окружения
		let serverStopCommand = (process.platform == 'win32') ? 
			'.\\dist\\orientdb-3.1.4\\bin\\shutdown.bat -p "root"' :
			'./dist/orientdb-3.1.4/bin/shutdown.sh -p "root"';

		cp.execSync(serverStopCommand, {env: getEnv()}, function(error, stdout, stderr){
			if (error) {
				console.log(error.message);
			}
			console.log(stdout);
			console.log(stderr);
		});
	}
	
	function createWindow() {
		// Automatically track and cleanup files at exit
		temp.track();

		console.log('Graphytica INFO: OrientDB Server starting...')

		let serverRunCommand = (process.platform == 'win32') ?
			'.\\dist\\orientdb-3.1.4\\bin\\server.bat' :
			'./dist/orientdb-3.1.4/bin/server.sh';

		let childProcess = cp.spawn(serverRunCommand, [], {env: getEnv()});
		childProcess.stdout.on("data", function(data) {
			console.log(data.toString());
		});
		childProcess.stderr.on("data", function(data) {
			console.error(data.toString());
		});

		if (!win) {
			let initialWidth = 800, initialHeight = 600
			win = new BrowserWindow({
				webPreferences: {
					enableRemoteModule: true,
					nodeIntegration: true
				},
				width: initialWidth,
				height: initialHeight,
				resizable: false,
				backgroundColor: '#ffffff',
				icon: path.join(__dirname, `dist/favicon.png`)
			})

			ipcMain.on('fixed-size', (event, arg) => {
				win.unmaximize();
				win.setSize(initialWidth,initialHeight)
				console.log('FIXED SIZE')
			})

			ipcMain.on('full-size', (event, arg) => {
				win.maximize()
			})
		
			ipcMain.on('has-unsaved-changes', (event, hasUnsaved) => {
				//console.log('main has-u-s', hasUnsaved)
				if (hasUnsaved == 'not_ready') return;
				const choice = dialog.showMessageBoxSync(win, {
					type: 'question',
					buttons: ['No', 'Yes'],
					title: hasUnsaved ? 'Есть несохраненные изменения!' : 'Выход',
					message: 'Вы уверены, что хотите выйти?' + (hasUnsaved ? '\nЕсть несохраненные изменения!' : '')
				});
				if (choice === 1) {
					//console.log('main send quit-request')
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
	
	function runServer() {
		function portInUse(port, callback) {
			var server = net.createServer(function(socket) {
				socket.write('Echo server\r\n');
				socket.pipe(socket);
			});
		
			server.listen(port, '127.0.0.1');
			server.on('error', function (e) {
				callback(true);
			});
			server.on('listening', function (e) {
				server.close();
				callback(false);
			});
		};
		
		function tryShutdown(currentPort, endPort, resolve) {
			portInUse(currentPort, function(inUse) {
				if (inUse) {
					console.log(`Graphytica WARN: Some application is using localhost:${currentPort}.
			Maybe it's OrientDB Server was not shut down last time for some reason. Trying to shut down...`)
					execShutdown();//sync
					portInUse(currentPort, function(inUse) {
						if (inUse) {
							console.log(`Graphytica WARN: Shut down took no effect, localhost:${currentPort} is still in use.`);
							if (currentPort >= endPort) resolve(-1);
							else tryShutdown(currentPort++, endPort, resolve);
						} else {
							console.log(`Graphytica INFO: OrientDB Server was successfully shut down.`);
							resolve(currentPort);
						}
					});
				} else {
					resolve(currentPort);
				}
			})
		}

		function kill() {
			console.log('Graphytica INFO: Trying to force-quit. Check for critical errors in log above.')
			if (win) win.close();
			else {
				execShutdown();
				process.exit(-1);
			}
		}

		let serverConfigPath = ".\\dist\\orientdb-3.1.4\\config\\orientdb-server-config.xml";
		let fromPort = 2424;
		let toPort = 2430;

		try {
			let fileContent = fs.readFileSync(serverConfigPath, "utf8");
			let regexp = /<listener protocol="binary" socket="default" port-range="(\d+)-(\d+)" ip-address=".*"\/>/;
			let match = regexp.exec(fileContent);
			fromPort = match[1]*1;
			toPort = match[2]*1;
			console.log(`Graphytica INFO: According to OrientDB Server configuration file, ports ${fromPort}-${toPort} will be used.`);
		} catch(e) {
			console.log("Graphytica WARN: Failed to access OrientDB Server configuration file "+serverConfigPath+"\n"+e)
			console.log("Graphytica INFO: Assuming that server will try to listen at default ports 2424-2430.")
		}
	
		tryShutdown(fromPort, toPort, function(binaryPortListeningAt) {
			if (binaryPortListeningAt < 0) {
				console.log('Graphytica ERROR: OrientDB Server is not able to run because all ports 2424-2430 at localhost are in use.'
					+' Try to free one of them or change server listener ports in orientdb-server-config.xml and restart.');
				kill();
				return;
			} else {

				console.log(`Graphytica INFO: OrientDB Server will probably be listening at port ${binaryPortListeningAt}`);
				let intervalTimeout = 120000, intervalStep = 200, serverWaitingTime = 0, rendererWaitingTime = 0;
				let checkServerReady = setInterval(function() {
					if (serverWaitingTime >= intervalTimeout) {
						// сервер не желает включаться (завис? ошибка?)
						clearInterval(checkServerReady);
						console.log(`Graphytica ERROR: Server waiting time exceeded: waiting for ${serverWaitingTime}ms already.
							Try to restart the app.`);
						kill();
						return;
					}
					portInUse(binaryPortListeningAt, function(inUse) {
						if (inUse) {

							// сервер включился, организуем отправку сообщения с подтверждением
							clearInterval(checkServerReady);
							let messageReceived = null;
							let sendInterval = setInterval(function() {
								if (rendererWaitingTime >= intervalTimeout) {
									// рендерер не желает получать сообщение (завис? ошибка?)
									clearInterval(sendInterval);
									console.log(`Graphytica ERROR: Renderer reply waiting time exceeded: waiting for ${rendererWaitingTime}ms already.
										Try to restart the app`);
									kill();
									return;
								}
								if (messageReceived != null) {
									// сообщение получено, с ошибкой или без - выключаем интервал
									clearInterval(sendInterval);
									if (messageReceived) console.log('Graphytica INFO: Server ready, renderer ready');
									else console.log('Graphytica ERROR: Renderer side error, message about server listening port not received. Try to restart the app');
								} else {
									console.log('Graphytica INFO: Server ready, renderer not ready');
									win.webContents.send('port-listening', binaryPortListeningAt);
								}
								rendererWaitingTime += intervalStep;
							}, intervalStep);
							ipcMain.on('port-listening', (event, status) => {
								messageReceived = !!status;
							});

						}
					});
					serverWaitingTime += intervalStep;
				}, intervalStep);
				createWindow();

			}
		});
	}
	
	ipcMain.on('export-database', (event, destination) => {
		console.log('Graphytica INFO: Trying to export database...')

		temp.open('graphytica', function(err, info) {
			if (err) console.log(err);
			else {
				let script = '';
				switch (process.platform) {
					case 'win32': script = '.\\dist\\orientdb-3.1.4\\bin\\console.bat'; break;
					default: script = './dist/orientdb-3.1.4/bin/console.sh'; break;
				}
				script += ` "CONNECT remote:localhost/tempdb root root;EXPORT DATABASE ${escapePathCom(info.path)};DISCONNECT"`;
				
				console.log('Graphytica INFO: Command to execute:', script);
				cp.exec(script, {env: getEnv()}, function(e, stdout, stderr) {
					if (e) {
						console.log('Graphytica ERROR: ' + e);
						if (stdout) console.log('Graphytica ERROR: stdout: ' + stdout.toString('utf-8'));
						if (stderr) console.log('Graphytica ERROR: stderr: ' + stderr.toString('utf-8'));
						win.webContents.send('export-success', false);
					} else {
						fs.copyFile(info.path, destination + '.gz', (err) => {
							if (err) console.log(err);
							else {
								console.log(info.path+' was copied to '+destination);
								fs.close(info.fd, function(err) {
									if (err) console.log(err);
									else {
										console.log('Graphytica INFO: export executed')
										console.log('Graphytica INFO: stdout: ' + stdout.toString('utf-8'));
										let params = JSON.stringify({
											src: destination + '.gz',
											format: ''
										});
										win.webContents.send('export-success', params);
									}
								});
							}
						});
					}
				})
			}
		})
	});
	
	ipcMain.on('import-database', async (event, params) => {
		console.log('Graphytica INFO: Trying to import database...')
		let paramsObj = JSON.parse(params);

		temp.open('graphytica', function(err, info) {
			if (err) console.log(err);
			else {
				fs.copyFile(paramsObj.src, info.path, (err) => {
					if (err) console.log(err);
					else {
						console.log(paramsObj.src+' was copied to '+info.path);
						fs.close(info.fd, function(err) {
							if (err) console.log(err);
							else {
								let script = '';
								switch (process.platform) {
									case 'win32': script = '.\\dist\\orientdb-3.1.4\\bin\\console.bat'; break;
									default: script = './dist/orientdb-3.1.4/bin/console.sh'; break;
								}
								script += ` "CONNECT remote:localhost/tempdb root root;`;
								script += `IMPORT DATABASE ${escapePathCom(info.path)}`;
								if (paramsObj.format != '') script += ` -format=${paramsObj.format}`;
								script += ` -merge=false;DISCONNECT"`;
								
								console.log('Graphytica INFO: Command to execute:', script);
		
								cp.exec(script, {env: getEnv()}, function(e, stdout, stderr) {
									if (e) {
										//он возвращает статус 1 если в скрипте была команда EXIT
										console.log('Graphytica ERROR: ' + e);
										if (stdout) console.log('Graphytica ERROR: stdout: ' + stdout.toString('utf-8'));
										if (stderr) console.log('Graphytica ERROR: stderr: ' + stderr.toString('utf-8'));
										win.webContents.send('import-success', false);
									} else {
										console.log('Graphytica INFO: import executed');
										console.log(stdout.toString('utf-8'));
										win.webContents.send('import-success', params);
									} 
								});
							}
						});
					}
				});
			}
		});
	});

	ipcMain.on('quit-request', (event, ready) => {
		console.log('main quit-request:', ready)
		rendererReadyToClose = ready;
		win.close();
		//then window-all-closed fires automatically
	});
	
	app.on('window-all-closed', function() {
		console.log('Graphytica INFO: window-all-closed...')
		execShutdown();//sync
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('ready', runServer)
	
	app.on('activate', function() {
		if (win === null) {
			runServer()
		}
	})
}).catch(err => {
    // This block will be executed if the app is already running
    console.log(err); // it will print out 'An application is already running'
});