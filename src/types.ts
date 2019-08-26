
export type Partial<T> = { [P in keyof T]?: T[P]; };
export type DeepPartial<T> = {
    // deeppartial with workaround for bug https://github.com/microsoft/TypeScript/issues/21592#issuecomment-496723647
    [P in keyof T]?: T[P] extends never ? DeepPartial<T[P]> : DeepPartial<T[P]>
};
export const nameof = <T>(name: keyof T) => name;
export interface Ctor<T> extends Function {
    new(...params: any[]): T; prototype: T;
}
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };