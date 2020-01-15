import { logger } from ".";
import { RetryState } from "../models";

/**
 * Retries a given function based on the provided retry state.
 *
 * @param {Function} aFunction The function to retry.
 * @param {RetryState} retryState The current retry state.
 * @returns {Promise<T>} The output of aFunction.
 */
export const retryFunctionWithState = async <T>(aFunction: Function, retryState: RetryState): Promise<T> => {
    retryState.registerRetry();

    try {
        return await new Promise((resolve, reject) => {
            setTimeout(async () => {
                logger.warn(`retrying after ${retryState.currentInterval}ms...`);
                try {
                    resolve(await aFunction());
                } catch (error) {
                    reject(error);
                }
            }, retryState.currentInterval);
        });
    } catch (error) {
        return retryFunctionWithState<T>(aFunction, retryState);
    }
};
