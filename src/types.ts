
export type Partial<T> = { [P in keyof T]?: T[P]; };
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]>; };
export const nameof = <T>(name: keyof T) => name;