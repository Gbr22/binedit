import { Editor } from "../editor";
import { defineSubsystem } from "../composition";


export const DisposeHandler = defineSubsystem({
    name: "DisposeHandler",
    proto: {
        onDispose(this: Editor, fn: ()=>void): void {
            this.disposeCallbacks.push(fn);
        },
        dispose(this: Editor): void {
            for (const fn of this.disposeCallbacks){
                fn();
            }
        }
    },
    init(this: Editor): {
        disposeCallbacks: (()=>void)[]
    } {
        const disposeCallbacks: (()=>void)[] = [];
        return {
            disposeCallbacks
        }
    }
});
