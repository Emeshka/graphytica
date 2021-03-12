const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const url = require("url");
const fs = require("fs");
const path = require("path");
const cp = require('child_process');
//const net = require('net');
//const temp = require('temp');
const legacy = require('legacy-encoding');
const SingleInstance = require('single-instance');

const locker = new SingleInstance('ae-graphytica');
locker.lock().then(() => {
	let win; let rendererReadyToClose = false;
	/*let odbRoot = path.join(__dirname, 'dist', 'orientdb-3.1.4');
	let odbDevRoot = path.join(__dirname, 'src', 'orientdb-3.1.4');*/

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
	
	/*function escapePathCom(filepath) {
		return '""'+filepath.replaceAll('\\', '\\\\')+'""';
	}

	function getEnv(home) {
		let environment = process.env;
		environment['ORIENTDB_HOME'] = home ? home : odbRoot;
		return environment;
	}
	
	function execShutdown() {
		//server.kill('SIGINT') не работает
		//exec/execSync - единственные могут его остановить
		//даже вручную из cmd его не вырубишь, ему надо переменную окружения
		let serverShutdownPath = path.join(odbRoot, 'bin', 'shutdown') + (process.platform == 'win32' ? '.bat' : '.sh')
		let home = odbRoot;
		if (!fs.existsSync(serverShutdownPath)) {
			//ng мог удалить и недоудалить папку dist, если делал build при запущенном сервере. попытка поискать в src
			serverShutdownPath = path.join(odbDevRoot, 'bin', 'shutdown') + (process.platform == 'win32' ? '.bat' : '.sh')
			home = odbDevRoot;
		}
		let serverStopCommand = `"${serverShutdownPath}" -p "root"`;
		//console.log(serverStopCommand);
		try {
			let stdout = cp.execSync(serverStopCommand, {env: getEnv(home)});
			console.log('Graphytica INFO: shutdown stdout:' + bufferToString(stdout));
		} catch (e) {
			console.log(`Graphytica ERROR: failed to shutdown OrientDB server:\n\n ${e}\n\n${e.stderr ? bufferToString(e.stderr) : ''}`)
		}
	}*/

	function kill() {
		console.log('Graphytica INFO: Trying to force-quit. Check for critical errors in log above.')
		//execShutdown();
		process.exit(-1);
	}

	process.on('SIGINT', kill);
	
	function createWindow() {
						//console.log('Graphytica INFO: argv: '+process.argv)
						// argument[1] when started by launcher as e.g. 'ae-graphytica.exe 9044'. When started by npm 'electron .',
						// argument[1] is . , and no pid is passed at all
						let pidSplashScreen = parseInt(process.argv[1]);
						if (pidSplashScreen) {
							process.kill(pidSplashScreen);
							console.log(`terminated ${pidSplashScreen}`);
						}
		//temp.track();
		//console.log('Graphytica INFO: OrientDB Server starting...')

		//let serverLauncherPath = path.join(odbRoot, 'bin', 'server') + (process.platform == 'win32' ? '.bat' : '.sh');
		//console.log(serverLauncherPath);

		/*try {
			let childProcess = cp.spawn(serverLauncherPath, [], {env: getEnv()});
			childProcess.on('error', function(e) {//e.g. ENOENT
				console.log('Graphytica ERROR: failed to run OrientDB server:\n\n' + e)
				kill();
				return;
			});
			childProcess.stdout.on("data", function(data) {
				console.log(bufferToString(data));
			});
			childProcess.stderr.on("data", function(data) {
				console.error(bufferToString(data));
			});
		} catch (e) {//e.g. EPERM
			console.log('Graphytica ERROR: failed to run OrientDB server:\n\n' + e)
			kill();
			return;
		}*/

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
				icon: path.join(__dirname, 'dist/favicon.png')
			})

			ipcMain.on('fixed-size', (event, arg) => {
				win.unmaximize();
				win.setSize(initialWidth,initialHeight)
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
	
	/*function runServer() {
		function portInUse(port, callback) {
			var server = net.createServer(function(socket) {
				socket.write('Echo server\r\n');
				socket.pipe(socket);
			}).on('error', function (e) {
				server.close();
				//console.log('Graphytica INFO: portInUse(): server.on("error"):\n\n' + e)
				callback(true);
			}).on('listening', function () {
				server.close();
				//console.log('Graphytica INFO: portInUse(): server.on("listening")')
				callback(false);
			}).listen(port, '127.0.0.1');
		};
		
		function tryShutdown(currentPort, endPort, resolve) {
			portInUse(currentPort, function(inUse) {
				if (inUse) {
					console.log(`Graphytica WARN: Some application is using localhost:${currentPort}.\
					Maybe it's OrientDB Server was not shut down last time for some reason. Trying to shut down...`)
					execShutdown();//sync
					portInUse(currentPort, function(inUse) {
						if (inUse) {
							console.log(`Graphytica WARN: Shut down took no effect, localhost:${currentPort} is still in use.`);
							if (currentPort >= endPort) resolve(-1);
							else tryShutdown(currentPort+1, endPort, resolve);
						} else {
							console.log('Graphytica INFO: OrientDB Server was successfully shut down.');
							resolve(currentPort);
						}
					});
				} else {
					resolve(currentPort);
				}
			})
		}

		let serverConfigPath = path.join(odbRoot, 'config', 'orientdb-server-config.xml');
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
			console.log('Graphytica WARN: Failed to access OrientDB Server configuration file '+serverConfigPath+'\n'+e)
			console.log('Graphytica INFO: Assuming that server will try to listen at default ports 2424-2430.')
		}
	
		tryShutdown(fromPort, toPort, function(binaryPortListeningAt) {
			if (binaryPortListeningAt < 0) {
				console.log(`Graphytica ERROR: OrientDB Server is not able to run because all ports 2424-2430 at localhost are in use.\
				Try to free one of them or change server listener ports in orientdb-server-config.xml and restart`);
				kill();
				return;
			} else {
				console.log(`Graphytica INFO: OrientDB Server will probably be listening at port ${binaryPortListeningAt}`);

				let intervalTimeout = 120000, intervalStep = 200, rendererWaitingTime = 0;
				let serverWaitingStartedTimestamp = new Date().getTime();
				let checkServerReady = function() {
					let serverWaitingTime = new Date().getTime() - serverWaitingStartedTimestamp;
					if (serverWaitingTime >= intervalTimeout) {
						// сервер не желает включаться (завис? ошибка?)
						console.log(`Graphytica ERROR: Server waiting time exceeded: waiting for ${serverWaitingTime}ms already.
							Try to restart the app.`);
						kill();
						return;
					}
					var server = net.createServer(function(socket) {
						socket.write('Echo server\r\n');
						socket.pipe(socket);
					}).on('error', function (e) {
						server.close();
						// сервер включился, организуем отправку сообщения с подтверждением
						//console.log('Graphytica INFO: argv: '+process.argv)
						// argument[1] when started by launcher as e.g. 'ae-graphytica.exe 9044'. When started by npm 'electron .',
						// argument[1] is . , and no pid is passed at all
						let pidSplashScreen = parseInt(process.argv[1]);
						if (pidSplashScreen) {
							process.kill(pidSplashScreen);
							console.log(`terminated ${pidSplashScreen}`);
						}
						let messageReceived = null;
						let sendInterval = setInterval(function() {
							if (rendererWaitingTime >= intervalTimeout) {
								// рендерер не желает получать сообщение (завис? ошибка?)
								clearInterval(sendInterval);
								console.log(`Graphytica ERROR: Renderer reply waiting time exceeded: waiting for ${rendererWaitingTime}ms already.\
									Try to restart the app`);
								kill();
								return;
							}
							if (messageReceived) {
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
							messageReceived = status || '';
						});
					}).on('listening', function () {
						server.close();
						setTimeout(checkServerReady, intervalStep);
					}).listen(binaryPortListeningAt, '127.0.0.1');
				};

				checkServerReady();
				createWindow();
			}
		});
	}
	
	ipcMain.on('export-database', (event, destination) => {
		//console.log('Graphytica INFO: Trying to export database...')

		temp.open({prefix: "graphytica", suffix: ".gz"}, function(err, info) {
			if (err) console.log(err);
			else {
				let script = '"'+path.join(odbRoot, 'bin', 'console') + (process.platform == 'win32' ? '.bat' : '.sh')+'"';
				let databasePath = escapePathCom(info.path.substring(0, info.path.length - 3))
				script += ` "CONNECT remote:localhost/tempdb root root;EXPORT DATABASE ${databasePath};DISCONNECT"`;
				
				//console.log('Graphytica INFO: Command to execute:', script);
				cp.exec(script, {env: getEnv()}, function(e, stdout, stderr) {
					if (e) {
						console.log('Graphytica ERROR: ' + e);
						if (stdout) console.log('Graphytica ERROR: stdout: ' + bufferToString(stdout));
						if (stderr) console.log('Graphytica ERROR: stderr: ' + bufferToString(stderr));
						win.webContents.send('export-success', false);
					} else {
						fs.copyFile(info.path, destination, (err) => {
							if (err) console.log(err);
							else {
								//console.log(info.path + ' was copied to '+destination);
								fs.close(info.fd, function(err) {
									if (err) console.log(err);
									else {
										//console.log('Graphytica INFO: export executed:\n\n' + bufferToString(stdout));
										let params = JSON.stringify({
											src: destination,
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
		//console.log('Graphytica INFO: Trying to import database...')
		let paramsObj = JSON.parse(params);

		temp.open('graphytica', function(err, info) {
			if (err) console.log(err);
			else {
				fs.copyFile(paramsObj.src, info.path, (err) => {
					if (err) console.log(err);
					else {
						//console.log(paramsObj.src+' was copied to '+info.path);
						fs.close(info.fd, function(err) {
							if (err) console.log(err);
							else {
								let script = '"'+path.join(odbRoot, 'bin', 'console') + (process.platform == 'win32' ? '.bat' : '.sh')+'"';
								script += ` "CONNECT remote:localhost/tempdb root root;`;
								script += `IMPORT DATABASE ${escapePathCom(info.path)}`;
								if (paramsObj.format != '') script += ` -format=${paramsObj.format}`;
								script += ` -merge=false;DISCONNECT"`;
								
								//console.log('Graphytica INFO: Command to execute:', script);
		
								cp.exec(script, {env: getEnv()}, function(e, stdout, stderr) {
									if (e) {
										//он возвращает статус 1 если в скрипте была команда EXIT
										console.log('Graphytica ERROR: ' + e);
										if (stdout) console.log('Graphytica ERROR: stdout: ' + bufferToString(stdout));
										if (stderr) console.log('Graphytica ERROR: stderr: ' + bufferToString(stderr));
										win.webContents.send('import-success', false);
									} else {
										//console.log('Graphytica INFO: import executed:\n\n' + bufferToString(stdout));
										win.webContents.send('import-success', params);
									} 
								});
							}
						});
					}
				});
			}
		});
	});*/

	ipcMain.on('quit-request', (event, ready) => {
		//console.log('main quit-request:', ready)
		rendererReadyToClose = ready;
		win.close();
		//then window-all-closed fires automatically
	});
	
	app.on('window-all-closed', function() {
		//console.log('Graphytica INFO: window-all-closed...')
		//execShutdown();//sync
		if (process.platform !== 'darwin') {
			app.quit()
		}
	})

	app.on('ready', () => {
		//console.log('Graphytica INFO: argv: '+process.argv)
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