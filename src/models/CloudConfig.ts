import { RetryOptions } from "./Retry";
import { DEFAULT_CONFIG_DIR } from "../constants";

export interface CloudConfigOptionsInput {
    bootstrapPath?: string;
    configPath?: string;
    activeProfiles?: string[];
    level?: string;
}

export class CloudConfigOptions {
    constructor(
        public bootstrapPath?: string,
        public configPath: string = DEFAULT_CONFIG_DIR,
        public activeProfiles: string[] = ['default'],
        public level: string = 'info'
    ) {}
}

export interface ConfigClientRetryOptions extends RetryOptions {}

export interface ConfigClientOptions {
    enabled: boolean;
    name: string;
    'fail-fast': boolean;
    retry?: ConfigClientRetryOptions;
}

export interface Document {
    // tslint:disable-next-line: no-any
    [name: string]: any;
}

export interface ConfigObject extends Document {}