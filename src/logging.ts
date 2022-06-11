import logger, { LoggerOptions } from 'pino';
import pretty from 'pino-pretty';

const stream = pretty();

export const createLogger = <T extends LoggerOptions>(
  opts: LoggerOptions | undefined
) => logger<T>(opts as any, stream);
