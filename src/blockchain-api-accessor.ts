import { Axios } from "axios";
import { Block, BlockchainAccessor, PromiseOfNullable } from "./types";

interface GetBlocksByHeightResponse {
    blocks: Block[];
}

const blocksCacheByHeight = new Map<number, Block>();

async function withCache(height: number, loadValue: (h: number) => Promise<Block>): Promise<Block> {
    if (blocksCacheByHeight.has(height)) {
        return blocksCacheByHeight.get(height)!;
    }

    const block = await loadValue(height);
    blocksCacheByHeight.set(height, block);

    return block;
}

export default class BlockchainApiAccessor implements BlockchainAccessor {
    readonly #axios = new Axios({
        baseURL: "https://blockchain.info",
    });
    #invocationsCount = 0;

    getBlockAtHeight = (height: number): PromiseOfNullable<Block> => {
        return withCache(
            height,
        async h => {
            const result = await this.#axios.get<GetBlocksByHeightResponse>(
                `/block-height/${h}`,
                {
                    responseType: "json",
                    params: {
                        format: "json"
                    }
                });
            this.#invocationsCount++;

            const data = typeof result.data === "string" ? JSON.parse(result.data) : result.data;

            return data?.blocks?.[0] ?? null;
        });
    }

    getLastBlock = async (): Promise<Block> => {
        const result = await this.#axios.get<Block>("latestblock");
        this.#invocationsCount++;

        const block = typeof result.data === "string" ? JSON.parse(result.data) : (result.data ?? null);

        blocksCacheByHeight.set(block?.height, block);

        return block;
    }

    numberOfInvocations = (): number => this.#invocationsCount;
}