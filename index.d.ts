export interface CloudConfigOptions {
    bootstrapPath?: string;
    configPath: string;
    activeProfiles: string[];
    level?: string;
}

export interface CloudConfig {
    [name: string]: any
}

export function load(options: CloudConfigOptions): Promise<CloudConfig>;

export function instance(): CloudConfig;

