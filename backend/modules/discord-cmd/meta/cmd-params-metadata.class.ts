import last from 'lodash/last';
import defaultTo from 'lodash/defaultTo';
import { Nullable } from 'ts-typedefs';

import { CmdParamMetadataApi, CmdScalarParam, CmdParamSchema, CmdParamsMetadataApi } 
from '../cmd.interfaces';

export class CmdParamsMetadata {
    readonly definition: readonly CmdParamMetadataApi[];
    readonly minRequiredAmount: number;
    readonly maxAmount: number;

    constructor({definition, minRequiredAmount, maxAmount}: CmdParamsMetadataApi) {
        const cls = CmdParamsMetadata;
        const hasRestParams = cls.isArraySchema(last(definition)!.schema);
        this.minRequiredAmount = defaultTo(
            minRequiredAmount, definition.length - +hasRestParams
        );
        this.maxAmount = defaultTo(
            maxAmount, hasRestParams ? 65535 : definition.length
        );
        this.definition = definition;
    }

    /** 
     * Pre: `paramIndex < .definition.length`.
     * Returns template usage representation of a single param under `paramIndex`.
     */
    getParamUsageTemplate(paramIndex: number): string {
        const cls         = CmdParamsMetadata;
        const param       = this.definition[paramIndex];
        const paramPrefix = cls.isArraySchema(param.schema)     ? '...' : '';
        const paramSuffix = paramIndex >= this.minRequiredAmount ? '?'  : '';
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
    transformValidateOrFail(params: readonly string[]): CmdScalarParam[] {
        if (params.length > this.maxAmount) {
            throw new Error(
                `Too many parameters (maximum ${'`'}${this.maxAmount}${'`'} allowed)`
            );
        }
        if (params.length < this.minRequiredAmount) {
            throw new Error(
                `Too few parameters (minimum ${'`'}${this.minRequiredAmount})${'`'} required`
            );
        }
        return this.transformValidateOrFailImpl(params);
    }
    private transformValidateOrFailImpl(params: readonly string[]): CmdScalarParam[] {
        const cls = CmdParamsMetadata;
        const resultParams = new Array<CmdScalarParam>();
        for (let i = 0; i < params.length; ++i) {
            const { schema, name } = this.definition[i];
            if (schema == null) {
                resultParams.push(params[i]);
            } else if (!cls.isArraySchema(schema)) {
                resultParams.push(cls.joiTransformValidateOrFail(
                    params[i], schema, name
                ) as any);
            } else {
                resultParams.push(...(cls.joiTransformValidateOrFail(
                    params.slice(i), schema, name
                )) as any);
                return resultParams;
            }
        }
        return resultParams;
    }


    private static joiTransformValidateOrFail(
        param:  string | string[], 
        schema: CmdParamSchema,
        name:   string
    ) {
        const {error, value} = schema.validate(param);
        if (error != null) {
            if (Array.isArray(param)) {
                param = param[+error.details[0].path];
            } 
            throw new Error(`*"${param}"* is not a valid value for ${'`'}<${name}>${'`'}`);
        }
        return value;
    }

    private static isArraySchema(schema: Nullable<CmdParamSchema>): boolean {
        return schema != null && schema.describe().type === 'array';
    }
}
