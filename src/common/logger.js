const Winston = require('winston');
const Config = require('../../config');

const LOGGER = (scope) => {
    const transports = [
        new (Winston.transports.Console)({
            timestamp: true,
            colorize: true,
            label: scope,
        }),
    ];
    return Winston.createLogger({
        level: 'info',
        transports,
        exceptionHandlers: [
            new (Winston.transports.Console)({
                timestamp: true,
                colorize: true,
                label: scope,
            }),
        ],
        exitOnError: false,
    });
};

module.exports = LOGGER(Config.appName);
