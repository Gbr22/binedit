type SubsystemDefinition<
    Name extends string,
    Fields extends object,
    InitFields extends object,
    Methods extends object
> = {
    name: Name,
    props: ()=>Fields
    proto: Methods
    init: ()=>InitFields
}

type AnySubsystem = SubsystemDefinition<string,any,object,any>;

type SubsystemExtras<Subsystem extends AnySubsystem> = {
    init: Subsystem["init"],
    name: Subsystem["name"]
}

export type SubsystemInterface<Subsystem extends AnySubsystem> = (
    ReturnType<Subsystem["props"]> &
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

type OptionalInitFunction = (()=>object) | (()=>void);

type PartialSubsystemDefinition<
    Name extends string,
    Fields extends object,
    InitFunction extends OptionalInitFunction,
    Methods extends object
> = {
    name: Name,
    props: ()=>Fields
    proto: Methods
    init: InitFunction
}

type AsCompleteSubsystem<SO extends PartialSubsystemDefinition<string,object,OptionalInitFunction,object>> = (
    SubsystemDefinition<
        SO["name"],
        ReturnType<SO["props"]>,
        (
            SO["init"] extends (()=>infer Obj extends object)
                ? Obj
                : object
        ),
        SO["proto"]
    >
);

export function defineSubsystem<
    Name extends string,
    Fields extends object,
    InitFunction extends (()=>object) | (()=>void),
    Methods extends object
>(args: PartialSubsystemDefinition<Name,Fields,InitFunction,Methods>):
    AsCompleteSubsystem<PartialSubsystemDefinition<Name,Fields,InitFunction,Methods>>
{
    type T = AsCompleteSubsystem<PartialSubsystemDefinition<Name,Fields,InitFunction,Methods>>;
    return defineSubsystemComplete<
        T["name"],
        ReturnType<T["props"]>,
        ReturnType<T["init"]>,
        T["proto"]
    >({
        name: args.name,
        props: args.props,
        proto: args.proto,
        init: function(this: object){
            const initalizedProps = (args.init.bind(this)() ?? {});
            return initalizedProps;
        } as T["init"]
    })
}

export function defineSubsystemComplete<
    Name extends string,
    Fields extends object,
    InitFields extends object,
    Methods extends object
>(props: SubsystemDefinition<Name,Fields,InitFields,Methods>){
    return {
        ...props,
        init: function(this: object){
            const initalizedProps = props.init.bind(this)();
            Object.assign(this,initalizedProps);
            return initalizedProps;
        }
    };
}

export function subsystemProps<Fields extends object>(): ()=>Fields {
    return ()=>{
        throw new Error("Unexpected call on subsystemFields");
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
