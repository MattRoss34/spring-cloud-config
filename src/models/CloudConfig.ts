import { RetryOptions } from "./Retry";

export interface CloudConfigOptions {
    bootstrapPath?: string;
    configPath: string;
    activeProfiles: string[];
    level?: string;
}

export interface ConfigClientRetryOptions extends RetryOptions {}

export interface ConfigClientOptions {
    enabled: boolean;
    'fail-fast': boolean;
    retry?: ConfigClientRetryOptions;
}

export interface Document {
    // tslint:disable-next-line: no-any
    [name: string]: any;
}

export interface ConfigObject extends Document {}