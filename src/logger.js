export default class Logger {
	constructor() {
		this._logLevelNames = ['debug', 'info', 'warn', 'error', 'fatal', 'off'];
		this.init();
	}
	init() {
		this._logLevel = this._logLevelNames.indexOf('warn');
	}
	setLogLevel(levelName) {
		if (levelName && (this._logLevelNames.indexOf(levelName.toLowerCase()) !== -1)) {
			this._logLevel = this._logLevelNames.indexOf(levelName.toLowerCase());
		}
	}
	_log(msg, levelName) {
		if (this._logLevel <= this._logLevelNames.indexOf(levelName)) {
			console.log('|html-screen-capture-js|' + levelName + '| ' + msg);
		}
	}
	isDebug() {
		return this._logLevel === this._logLevelNames.indexOf('debug');
	}
	debug(msg) {
		this._log(msg, 'debug');
	};
	info(msg) {
		this._log(msg, 'info');
	};
	warn(msg) {
		this._log(msg, 'warn');
	};
	error(msg) {
		this._log(msg, 'error');
	};
	fatal(msg) {
		this._log(msg, 'fatal');
	};
}
