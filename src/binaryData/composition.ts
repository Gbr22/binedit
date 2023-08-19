export type Constructor<I extends Base> = new (...args: any[]) => I;

export class Base {}

export function Implementations<
    TArg extends Constructor<Base>,
    TReturn extends (...args: any[])=>any,
>(extend: (arg: TArg)=>TReturn): TReturn {
    return extend(Base as any);
}

export function chainImpl<TClass extends new (...args: any[])=>any>(cls: TClass){
    function _continue<
        TArg extends TClass,
        TReturn extends (...args: any[])=>any,
    >(extend: (arg: TArg)=>TReturn): TReturn {
        return extend(cls as any);
    }

    return Object.assign(_continue,{
        $: cls
    })
}