
export abstract class Subclass<Proto extends object> {
    $: Proto;

    constructor(parent: Proto) {
        this.$ = parent;
    }
}

