type SubsystemDefinition<
    Name extends string,
    InitFields extends object,
    Methods extends object
> = {
    name: Name,
    proto: Methods
    init: ()=>InitFields
}

type AnySubsystem = SubsystemDefinition<string,object,any>;

type SubsystemExtras<Subsystem extends AnySubsystem> = {
    init: Subsystem["init"],
    name: Subsystem["name"]
}

export type SubsystemInterface<Subsystem extends AnySubsystem> = (
    ReturnType<Subsystem["init"]> &
    Subsystem["proto"] &
    {
        [Key in `${Subsystem["name"]}`]: SubsystemExtras<Subsystem>
    }
);

type VoidAsEmptyObject<T extends object | void | undefined> = (
    T extends (infer Obj extends object)
        ? Obj
        : object
);

type OptionalInitFunction = (()=>object) | (()=>void) | undefined;

type PartialSubsystemDefinition<
    Name extends string,
    Init extends OptionalInitFunction,
    Methods extends object
> = ({
    name: Name,
    proto: Methods
    init?: Init
})

const NeverSymbol = Symbol("never");
type NeverSymbol = typeof NeverSymbol;

type NeverToSymbol<V> = (
    (V | NeverSymbol) extends NeverSymbol | infer Type
        ? Type
        : NeverSymbol
);

type NeverToUndefined<V> = (
    NeverToSymbol<V> extends NeverSymbol
        ? undefined
        : V
);

type ValueOf<Obj extends object, Key extends string> = (
    Obj extends { [key in Key]: infer Value extends {} }
        ? NeverToUndefined<Value>
        : undefined
);

type UseDefaultReturn<
    Fn extends (...rest: unknown[])=>unknown,
    Default
> = (
    Fn extends ((...rest: any[])=>undefined) | (()=>null) | (()=>void)
        ? (...rest: Parameters<Fn>)=>Default
        : Fn
);
type UseDefault<Value, Default> = (
    Value extends (void | undefined | null)
        ? Default
        : Value
);

type UseDefaultFunctionWithReturn<
    MaybeFn extends Function | undefined | null | void,
    DefaultFn extends (...rest: any[])=>any
> = UseDefault<(
    MaybeFn extends infer Fn extends ((...rest: any[])=>any)
        ? UseDefaultReturn<Fn,ReturnType<DefaultFn>>
        : undefined
),DefaultFn>;

type AsCompleteSubsystem<SO extends PartialSubsystemDefinition<string,OptionalInitFunction,object>> = (
    SubsystemDefinition<
        SO["name"],
        (
            ValueOf<SO,"init"> extends (()=>infer Obj extends object)
                ? Obj
                : object
        ),
        SO["proto"]
    >
);

function isVoid(arg: unknown): arg is void {
    return arg == undefined;
}

function useDefault<
    T extends any | undefined | null | void,
    Default
>(v: T, d: Default): UseDefault<T,Default> {
    if (isVoid(v)){
        return d as UseDefault<T,Default>;
    }
    return (v ?? d) as UseDefault<T,Default>;
}

function useDefaultFunctionWithReturn<
    MaybeFn extends Function | undefined | null | void | never,
    DefaultFn extends (...rest: any[])=>any
>(maybeFn: MaybeFn, defaultFn: DefaultFn): UseDefaultFunctionWithReturn<MaybeFn,DefaultFn> {
    const fn = useDefault(maybeFn,defaultFn);
    return function(this: any, ...rest: any[]){
        return fn.bind(this)(...rest);
    } as any;
}

export function defineSubsystem<
    Def extends PartialSubsystemDefinition<string,OptionalInitFunction,object>
>(args: Def):
    AsCompleteSubsystem<Def>
{
    type CompleteType = AsCompleteSubsystem<Def>;
    return defineSubsystemComplete<
        CompleteType["name"],
        ReturnType<CompleteType["init"]>,
        CompleteType["proto"]
    >({
        name: args.name,
        proto: args.proto,
        init: useDefaultFunctionWithReturn(args.init,(()=>{
            return {};
        }) as CompleteType["init"])
    })
}

export function defineSubsystemComplete<
    Name extends string,
    InitFields extends object,
    Methods extends object
>(props: SubsystemDefinition<Name,InitFields,Methods>){
    return {
        ...props,
        init: function(this: object){
            const initalizedProps = props.init.bind(this)();
            Object.assign(this,initalizedProps);
            return initalizedProps;
        }
    };
}

function getSubsystemExtras<Subsystem extends AnySubsystem>(that: object, subsystem: Subsystem): SubsystemExtras<Subsystem> {
    return {
        name: subsystem.name,
        init: subsystem.init.bind(that),
    };
}

type Classlike = { prototype: {} } & object;

export function attachSubsystem<Subsystem extends AnySubsystem>(cls: Classlike, subsystem: Subsystem) {
    Object.assign(cls.prototype,subsystem.proto);
    Object.defineProperty(cls.prototype, subsystem.name,{
        get: function() {
            return getSubsystemExtras(this,subsystem);
        }
    })
}

export function attachSubsystems(cls: Classlike, subsystems: AnySubsystem[]){
    for (let s of subsystems) {
        attachSubsystem(cls,s);
    }
}

export class Subsystems<Arr extends AnySubsystem[]> {
    definitions: Arr;

    constructor(...definitions: Arr){
        this.definitions = definitions;
    }

    attach(cls: Classlike) {
        attachSubsystems(cls,this.definitions);
    }

    init(instance: object) {
        for (let definition of this.definitions){
            const { name } = definition;
            if (!(name in instance)) {
                continue;
            }
            const obj = (instance as any)[name] as unknown;
            if (!(obj instanceof Object)) {
                continue;
            }
            if (!("init" in obj)){
                continue;
            }
            const init = obj["init"];
            if (!(init instanceof Function)){
                continue;
            }
            init();
        }
    }
}

type AnySubsystems = Subsystems<AnySubsystem[]>;

type TakeFirst<Arr extends any[]> = Arr extends [infer First,...infer Rest] ? {
    first: First
    rest: Rest
} : undefined;

type TakeFirstTwo<Arr extends any[]> = Arr extends [infer First, infer Second,...infer Rest] ? {
    first: First
    second: Second
    rest: Rest
} : undefined;

type ArrayIntersection<Arr extends any[]> = (
    TakeFirstTwo<Arr> extends object
        ? ArrayIntersection<[TakeFirstTwo<Arr>["first"] & TakeFirstTwo<Arr>["second"],...TakeFirstTwo<Arr>["rest"]]>
        : TakeFirst<Arr> extends object
            ? TakeFirst<Arr>["first"]
            : never
);

export function IntersectArray<Arr extends any[]>(arr: Arr): ArrayIntersection<Arr> {
    let obj = {};

    return obj as any;
}

type MapSubsystemInterface<Arr extends AnySubsystem[]> = {
    [Index in keyof Arr]: SubsystemInterface<Arr[Index]>
}

export type CombinedSubsystems<S extends AnySubsystems> = (
    ArrayIntersection<MapSubsystemInterface<S["definitions"]>>
);
