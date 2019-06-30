export interface CloudConfigOptions {
    bootstrapPath?: string;
    configPath: string;
    activeProfiles: string[];
    level?: string;
}

export interface Document {
    [name: string]: any
}

export interface ConfigObject extends Document {}