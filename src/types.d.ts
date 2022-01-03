export interface Block {
    height: number;
    time: number;
}

export type Nullable<T> = T | null;

export type PromiseOfNullable<T> = Promise<Nullable<T>>;

export interface BlockchainAccessor {
    getLastBlock(): Promise<Block>;
    getBlockAtHeight(height: number): PromiseOfNullable<Block>;
}
