import { Axios } from "axios";
import { Block, BlockchainAccessor, PromiseOfNullable } from "./types";

interface GetBlocksByHeightResponse {
    blocks: Block[];
}

export default class BlockchainApiAccessor implements BlockchainAccessor {
    readonly #axios = new Axios({
        baseURL: "https://blockchain.info",
    });
    #invocationsCount = 0;

    getBlockAtHeight = async (height: number): PromiseOfNullable<Block> => {
        const result = await this.#axios.get<GetBlocksByHeightResponse>(
            `/block-height/${height}`,
            {
                responseType: "json",
                params: {
                    format: "json"
                }
            });
        this.#invocationsCount++;

        const data = typeof result.data === "string" ? JSON.parse(result.data) : result.data;

        return data?.blocks?.[0] ?? null;
    }

    getLastBlock = async (): Promise<Block> => {
        const result = await this.#axios.get<Block>("latestblock");
        this.#invocationsCount++;

        return typeof result.data === "string" ? JSON.parse(result.data) : (result.data ?? null);
    }

    numberOfInvocations = (): number => this.#invocationsCount;
}