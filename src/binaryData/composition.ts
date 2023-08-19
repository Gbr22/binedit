export type Constructor<I extends Base> = new (...args: any[]) => I;

export class Base {}

export type ReturnFunc<T extends Constructor<Base>> = <I extends ImplFun<any>>()=>any
export type ImplFun<T extends Constructor<Base>> = (constructor: T)=>ReturnFunc<T>;

export function Implementations<
    TArg extends Constructor<Base>,
    TReturn extends (...args: any[])=>any,
>(extend: (arg: TArg)=>TReturn): TReturn {
    return extend(Base as any);
}