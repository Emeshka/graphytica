const fs = require("fs");
const path = require("path");
const execSync = require('child_process').execSync;

let app = 'ae-graphytica-'
let os = ['win32', 'linux']
let arch = ['ia32', 'x64']

for (o of os) {
	for (a of arch) {
		let name = app + o + '-' + a
		let launcherName = 'splash' + ((o == 'win32') ? '.exe' : '')
		let src = path.join(__dirname, launcherName)
		let destFolder = path.join(__dirname, '..', '..', name)
		let dest = path.join(destFolder, launcherName)

		if (fs.existsSync(destFolder)) {
			if (!fs.existsSync(src)) {
				if (process.platform == o) {
					if (o == 'win32') {
						try {
							let buildBat = path.join(__dirname, 'build.bat')
							console.log(execSync('start ' + buildBat, {cwd: __dirname}).toString('utf-8'));
						} catch (e) {
							console.log(`${e}\n\n${e.stderr ? e.stderr.toString('utf-8') : ''}`);
						}
					} //else надо пробовать колдовать с Makefile_lin

					fs.copyFile(src, dest, (err) => {console.log(err)})
				} else {
					console.log(`Skipping copying launcher for OS ${o} arch ${a} release, because there's no compiled executable for ${o} and it cannot be compiled on your OS (${process.platform}).`)
				}
			} else {
				fs.copyFile(src, dest, (err) => {console.log(err)})
			}
		} else {
			console.log(`Skipping copying launcher for OS ${o} arch ${a} release, because path ${destFolder} doesn't exist.`)
		}
	}
}