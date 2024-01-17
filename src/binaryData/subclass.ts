
const SubclassInit = Symbol("Subclass init function");

export abstract class Subclass<Proto extends object> {
    $: Proto;

    constructor(parent: Proto) {
        this.$ = parent;

        this[SubclassInit]();
    }

    [SubclassInit](){}

    static init = SubclassInit;
}

