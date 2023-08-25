export interface Action {
    name: string
    fn: ()=>void
}