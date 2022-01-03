import { AVERAGE_BLOCK_DURATION, GENESIS_BLOCK_TIMESTAMP } from "./constants";
import { Block, BlockchainAccessor, PromiseOfNullable } from "./types";

export default class BlockchainCrawler {
    readonly #blockchainAccessor: BlockchainAccessor;
    constructor(
        blockchainAccessor: BlockchainAccessor,
    ) {
        this.#blockchainAccessor = blockchainAccessor;
    }

    #findBlockAtHeight = async (height: number): Promise<Block> => {
        const block = await this.#blockchainAccessor.getBlockAtHeight(height);
        return block!;
    }

    #approximateBlock = async (timestamp: number, lastBlock: Block) => {
        const expectedBlockHeight = Math.floor((timestamp - GENESIS_BLOCK_TIMESTAMP) / AVERAGE_BLOCK_DURATION);
        const initialApproximationBlock = await this.#blockchainAccessor.getBlockAtHeight(expectedBlockHeight);
        if (!initialApproximationBlock) {
            return lastBlock.height;
        }

        let previousBlock = lastBlock;
        let currentBlock = initialApproximationBlock;

        let approximationCount = 0;
        while (
            Math.abs(previousBlock.height - currentBlock.height) > 1
            || currentBlock.time < timestamp && previousBlock.time < timestamp
        ) {
            let heightDelta = Math.floor((timestamp - currentBlock.time) / AVERAGE_BLOCK_DURATION);
            if (heightDelta === 0) {
                heightDelta = 1;
            }

            let nextHeight = currentBlock.height + heightDelta;

            if (heightDelta > 0
                && previousBlock.height > currentBlock.height
                && nextHeight >= previousBlock.height
            ) {
                nextHeight = previousBlock.height - 1;
            }

            if (heightDelta < 0
                && currentBlock.height > previousBlock.height
                && nextHeight <= previousBlock.height
            ) {
                nextHeight = previousBlock.height + 1;
            }

            previousBlock = currentBlock;
            currentBlock = await this.#findBlockAtHeight(nextHeight);
            approximationCount++;

            console.log(`Approximation #${approximationCount}; current block: {height=${currentBlock.height}, time=${currentBlock.time}}; previous block: {height=${previousBlock.height}, time=${previousBlock.time}}`);
        }

        return previousBlock.height > currentBlock.height ? currentBlock.height : previousBlock.height;
    }

    findLastBlockHeightBefore = async (timestamp: number): PromiseOfNullable<number> => {
        if (timestamp < GENESIS_BLOCK_TIMESTAMP) {
            return null;
        }

        const lastBlock = await this.#blockchainAccessor.getLastBlock();
        if (timestamp > lastBlock.time) {
            return lastBlock.height;
        }

        return await this.#approximateBlock(timestamp, lastBlock);
    }
}