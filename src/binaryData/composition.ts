type Subsystem<
    Name extends string,
    Fields extends object,
    Methods extends object
> = {
    name: Name,
    props: ()=>Fields
    proto: Methods
    init: ()=>void
}

type AnySubsystem = Subsystem<any,any,any>;

type SubsystemExtras<Subsystem extends AnySubsystem> = {
    init: Subsystem["init"],
    name: Subsystem["name"]
}

export type SubsystemInterface<Subsystem extends AnySubsystem> = (
    ReturnType<Subsystem["props"]> &
    Subsystem["proto"] &
    {
        [Key in `${Subsystem["name"]}`]: SubsystemExtras<Subsystem>
    }
);

export function defineSubsystem<
    Name extends string,
    Fields extends object,
    Methods extends object
>(props: Subsystem<Name,Fields,Methods>){
    return props;
}

export function subsystemProps<Fields extends object>(): ()=>Fields {
    return ()=>{
        throw new Error("Unexpected call on subsystemFields");
    };
}

function getSubsystemExtras<Subsystem extends AnySubsystem>(that: unknown, subsystem: Subsystem): SubsystemExtras<Subsystem> {
    return {
        name: subsystem.name,
        init: subsystem.init.bind(that),
    };
}

export function attachSubsystem<Subsystem extends AnySubsystem>(cls: { prototype: {} }, subsystem: Subsystem) {
    Object.assign(cls.prototype,subsystem.proto);
    Object.defineProperty(cls.prototype, subsystem.name,{
        get: function() {
            return getSubsystemExtras(this,subsystem);
        }
    })
}

export function attachSubsystems(cls: { prototype: {} }, subSystems: AnySubsystem[]){
    for (let s of subSystems) {
        attachSubsystem(cls,s);
    }
}

export function Subsystems<Arr extends AnySubsystem[]>(...rest: Arr): Arr {
    return rest;
}

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

export type CombinedSubsystemInterface<Arr extends AnySubsystem[]> = (
    ArrayIntersection<MapSubsystemInterface<Arr>>
);
