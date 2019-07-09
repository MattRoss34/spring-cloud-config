import { ConfigObject, RetryOptions, RetryState, ConfigClientOptions } from "../models";
import { logger } from "../utils";
import { SpringCloudConfigGatewayImpl } from "../gateways/SpringCloudConfigGatewayImpl";
import { injectable } from "inversify";
import { retryFunctionWithState } from "../utils";

@injectable()
export class SpringCloudConfigServiceImpl {

    constructor(
        private readonly springCloudConfigGatewayImpl: SpringCloudConfigGatewayImpl
    ) {}

    /**
     * Reads the external configuration from a Spring Cloud Config Server, with retry if enabled.
     *
     * @param {ConfigObject} bootstrapConfig The bootstrap properties needed for Spring Cloud Config.
     * @returns {Promise<ConfigObject>} The Spring Environment Object obtained from the Config Server.
     */
    public async getConfigFromServer(bootstrapConfig: ConfigObject): Promise<ConfigObject> {
        const configClientOptions: ConfigClientOptions = bootstrapConfig.spring.cloud.config;
        const retryConfig: RetryOptions | undefined = configClientOptions.retry;
        let cloudConfig: ConfigObject = {};

        if (configClientOptions.enabled) {
            logger.debug("Spring Cloud Options: " + JSON.stringify(configClientOptions));

            const retryState: RetryState = new RetryState(retryConfig);

            try {
                cloudConfig = await this.springCloudConfigGatewayImpl.getConfigFromServer(configClientOptions);
                logger.debug("Cloud Config: " + JSON.stringify(cloudConfig));
            } catch (error) {
                logger.warn("Error reading cloud config: ", error);
                if (configClientOptions['fail-fast'] === true) {
                    if (retryConfig && retryConfig.enabled === true) {
                        cloudConfig = await retryFunctionWithState<ConfigObject>(
                            () => this.springCloudConfigGatewayImpl.getConfigFromServer(configClientOptions),
                            retryState
                        );
                    } else {
                        throw error;
                    }
                }
            }
        }

        return cloudConfig;
    }

}