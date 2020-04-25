export enum LogLevels {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
    OFF = 'off',
}

let selectedLogLevel: LogLevels = LogLevels.WARN;

const setLogLevel = (levelName: LogLevels = LogLevels.WARN): void => {
    selectedLogLevel = levelName;
};

const getLogLevel = (): LogLevels => {
    return selectedLogLevel;
};

const log = (msg: string, levelName: LogLevels = selectedLogLevel): void => {
    console.log('|html-screen-capture-js|' + levelName + '| ' + msg);
};

const isDebug = (): boolean => {
    return selectedLogLevel === LogLevels.DEBUG;
};

const debug = (msg: string): void => {
    log(msg, LogLevels.DEBUG);
};
const info = (msg: string): void => {
    log(msg, LogLevels.INFO);
};

const warn = (msg: string): void => {
    log(msg, LogLevels.WARN);
};
const error = (msg: string): void => {
    log(msg, LogLevels.ERROR);
};
const fatal = (msg: string): void => {
    log(msg, LogLevels.FATAL);
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
