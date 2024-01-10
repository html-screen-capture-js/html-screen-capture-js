import { LogLevel } from './types';

let selectedLogLevel: LogLevel = LogLevel.WARN;

const setLogLevel = (levelName: LogLevel = LogLevel.WARN): void => {
	selectedLogLevel = levelName;
};
const getLogLevel = (): LogLevel => {
	return selectedLogLevel;
};
const log = (msg: string, levelName: LogLevel): void => {
	const logLevelNumbers = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL, LogLevel.OFF];
	if (logLevelNumbers.indexOf(levelName) >= logLevelNumbers.indexOf(selectedLogLevel)) {
		console.log('|html-screen-capture-js|' + levelName + '| ' + msg);
	}
};
const isDebug = (): boolean => {
	return selectedLogLevel === LogLevel.DEBUG;
};
const debug = (msg: string): void => {
	log(msg, LogLevel.DEBUG);
};
const info = (msg: string): void => {
	log(msg, LogLevel.INFO);
};
const warn = (msg: string): void => {
	log(msg, LogLevel.WARN);
};
const error = (msg: string): void => {
	log(msg, LogLevel.ERROR);
};
const fatal = (msg: string): void => {
	log(msg, LogLevel.FATAL);
};

export const logger = {
	isDebug,
	setLogLevel,
	getLogLevel,
	debug,
	info,
	warn,
	error,
	fatal,
};
