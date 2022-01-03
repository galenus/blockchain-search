import { AVERAGE_BLOCK_DURATION, GENESIS_BLOCK_TIMESTAMP } from "./constants";
import { Block, BlockchainAccessor, Nullable, PromiseOfNullable } from "./types";

interface Approximation {
    block: Nullable<Block>;
    height: number;
}

interface ApproximationBrackets {
    bottom: Approximation;
    top: Approximation;
}

export default class BlockchainCrawler {
    readonly #blockchainAccessor: BlockchainAccessor;
    constructor(
        blockchainAccessor: BlockchainAccessor,
    ) {
        this.#blockchainAccessor = blockchainAccessor;
    }

    #findBlock = async (height: number, currentBlock: Nullable<Block>): Promise<Approximation> => {
        if (currentBlock?.height === height) return { block: currentBlock, height };

        return {
            block: await this.#blockchainAccessor.getBlockAtHeight(height),
            height,
        };
    }

    #approximateBlockRecursively = async (
        timestamp: number,
        {  bottom, top }: ApproximationBrackets,
    ): PromiseOfNullable<number> => {
        if ((top.block?.time ?? 0) >= timestamp
            && (bottom.block?.time ?? 0) < timestamp
            && top.height - bottom.height <= 1) {
            return bottom.height;
        }

        if (!top.block) {
            return this.#approximateBlockRecursively(
                timestamp,
                {
                    bottom,
                    top: await this.#findBlock(bottom.block!.height + Math.ceil((top.height - bottom.height) / 2), null),
                }
            );
        }

        if (!bottom.block) {
            return this.#approximateBlockRecursively(
                timestamp,
                {
                    bottom: await this.#findBlock(top.block!.height - Math.ceil((top.height - bottom.height) / 2), null),
                    top,
                }
            );
        }

        if (top.block.time < timestamp) {
            return this.#approximateBlockRecursively(
                timestamp,
                {
                    bottom: top,
                    top: await this.#findBlock(top.block.height + Math.ceil((timestamp - top.block.time) / AVERAGE_BLOCK_DURATION), top.block),
                },
            )
        }

        if (bottom.block.time > timestamp) {
            return this.#approximateBlockRecursively(
                timestamp,
                {
                    bottom: await this.#findBlock(bottom.block.height - Math.ceil((bottom.block.time - timestamp) / AVERAGE_BLOCK_DURATION), bottom.block),
                    top: bottom,
                },
            )
        }

        return this.#approximateBlockRecursively(
            timestamp,
            {
                bottom: await this.#findBlock(bottom.height + Math.floor((timestamp - bottom.block.time) / AVERAGE_BLOCK_DURATION), bottom.block),
                top: await this.#findBlock(top.height - Math.floor((top.block.time - timestamp) / AVERAGE_BLOCK_DURATION), top.block),
            }
        );
    }

    #approximateBlock = async (timestamp: number, lastBlock: Block) => {
        const expectedBlockHeight = Math.floor((timestamp - GENESIS_BLOCK_TIMESTAMP) / AVERAGE_BLOCK_DURATION);
        const initialApproximationBlock = await this.#blockchainAccessor.getBlockAtHeight(expectedBlockHeight);
        if (!initialApproximationBlock) {
            return lastBlock.height;
        }

        return this.#approximateBlockRecursively(timestamp, {
            bottom: initialApproximationBlock.time >= timestamp
                ? await this.#findBlock(initialApproximationBlock.height - Math.ceil((initialApproximationBlock.time - timestamp) / AVERAGE_BLOCK_DURATION), null)
                : { block: initialApproximationBlock, height: expectedBlockHeight },
            top: initialApproximationBlock.time >= timestamp
                ? { block: initialApproximationBlock, height: expectedBlockHeight }
                : await this.#findBlock(initialApproximationBlock.height + Math.ceil((timestamp - initialApproximationBlock.time) / AVERAGE_BLOCK_DURATION), null),
        });
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