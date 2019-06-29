import _ from 'lodash';
import { Nullable } from 'ts-typedefs';

import { DiscordCmdParamMetadataApi, DiscordCmdScalarParam, DiscordCmdParamSchema, DiscordCmdParamsMetadataApi } 
from '../discord.interfaces';

export class DiscordCmdParamsMetadata {
    readonly definition: readonly DiscordCmdParamMetadataApi[];
    readonly minRequiredAmount: number;
    readonly maxAmount: number;

    constructor({definition, minRequiredAmount, maxAmount}: DiscordCmdParamsMetadataApi) {
        const cls = DiscordCmdParamsMetadata;
        const hasRastParams = cls.isArraySchema(_.last(definition)!.schema);
        this.minRequiredAmount = _.defaultTo(
            minRequiredAmount, definition.length - +hasRastParams
        );
        this.maxAmount = _.defaultTo(
            maxAmount, hasRastParams ? 65535 : definition.length
        );
        this.definition = definition;
    }

    /** 
     * Pre: `paramIndex < .definition.length`.
     * Returns template usage representation of a single param under `paramIndex`.
     */
    getParamUsageTemplate(paramIndex: number) {
        const cls         = DiscordCmdParamsMetadata;
        const param       = this.definition[paramIndex];
        const paramPrefix = cls.isArraySchema(param.schema)     ? '...' : '';
        const paramSuffix = paramIndex > this.minRequiredAmount ? '?'   : '';
        return `<${paramPrefix}${param.name}${paramSuffix}>`;
    }


    /**
     * Attempts to validate and transform parameters to their appropriate types.
     * If failed, throws `Error` with the failure desciption.
     * 
     * @param params  Command parameters splitted into an array.
     * 
     * @returns Array of transformed to their type and validated parameters.
     */
    tryTransformValidateOrFail(
        params: readonly string[]
    ) {
        if (params.length > this.maxAmount) {
            throw new Error(
                `Too many parameters (maximum ${'`'}${
                this.maxAmount}${`'`} allowed)`
            );
        }
        if (params.length < this.minRequiredAmount) {
            throw new Error(
                `Too few parameters (minimum ${'`'}${
                this.minRequiredAmount})${'`'} required`
            );
        }
        return this.tryTransformValidateOrFailImpl(params);
    }
    private tryTransformValidateOrFailImpl(params: readonly string[]) {
        const cls = DiscordCmdParamsMetadata;
        const resultParams = new Array<DiscordCmdScalarParam>();
        for (let i = 0; i < params.length; ++i) {
            const { schema, name } = this.definition[i];
            if (schema == null) {
                resultParams.push(params[i]);
            } else if (!cls.isArraySchema(schema)) {
                resultParams.push(cls.tryJoiTransformValidateOrFail(
                    params[i], schema, name
                ) as DiscordCmdScalarParam);
            } else {
                resultParams.push(...(cls.tryJoiTransformValidateOrFail(
                    params.slice(i), schema, name
                )) as DiscordCmdScalarParam[]);
                return resultParams;
            }
        }
        return resultParams;
    }


    private static tryJoiTransformValidateOrFail(
        param:  string | string[], 
        schema: DiscordCmdParamSchema,
        name:   string
    ) {
        const {error, value} = schema.validate(param);
        if (error != null) {
            throw new Error(`"${param}" is not a valid value for <${name}>`);
        }
        return value;
    }

    private static isArraySchema(schema: Nullable<DiscordCmdParamSchema>) {
        return schema != null && schema.describe().type === 'array';
    }
}