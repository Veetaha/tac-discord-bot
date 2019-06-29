
import { Obj, FilterProps, Op, Func } from 'ts-typedefs';

export type CoreObjData<TObj extends Obj> = FilterProps<
    TObj,
    Op.NotExtends<Func<any, any, TObj>>
>;

export abstract class AssignConstructable<TDerived extends Obj> {
    constructor(data: CoreObjData<TDerived>) {
        Object.assign(this, data);
    }
}