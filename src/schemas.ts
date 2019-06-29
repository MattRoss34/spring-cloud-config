import * as joi from '@hapi/joi';

export const CloudConfigOptionsSchema = joi.object().keys({
    bootstrapPath: joi.string(),
    configPath: joi.string().required(),
    activeProfiles: joi.array().items(joi.string()).required(),
    level: joi.string()
});

export const BootstrapConfigSchema = joi.object().keys({
    spring: joi.object().required().keys({
        cloud: joi.object().required().keys({
            config: joi.object().required().keys({
                enabled: joi.boolean().required(),
                'fail-fast': joi.boolean(),
                name: joi.string(),
                endpoint: joi.string().uri().when(
                    'enabled',
                    {
                        is: true,
                        then: joi.required()
                    }),
                label: joi.string(),
                rejectUnauthorized: joi.boolean(),
                auth: joi.object().keys({
                    user: joi.string().required(),
                    pass: joi.string().required()
                })
            })
        })
    })
});