import BlockchainCrawler from "../src/blockchain-crawler";
import { AVERAGE_BLOCK_DURATION, GENESIS_BLOCK_TIMESTAMP } from "../src/constants";
import { Block } from "../src/types";

function generateBlocks(blocksCount: number) {
    const blocks: Block[] = [];
    let currentBlockTimestamp = GENESIS_BLOCK_TIMESTAMP;
    for (let height = 0; height < blocksCount; height++) {
        blocks.push({
            height,
            time: currentBlockTimestamp,
        });

        currentBlockTimestamp = currentBlockTimestamp
            + AVERAGE_BLOCK_DURATION
            - Math.ceil(AVERAGE_BLOCK_DURATION / 2) + Math.round(AVERAGE_BLOCK_DURATION / 2 * Math.random());
    }

    return blocks;
}

function printBlock({ height, time }: Block) {
    return `Block{height=${height},time=${time}}`;
}

function printBlocks(...blocks: Block[]) {
    return blocks.map(printBlock).join(",");
}

describe("blockchain crawler", () => {
    const blocks = generateBlocks(1000);
    const lastBlock = blocks[blocks.length - 1];

    const testTarget = new BlockchainCrawler({
        getBlockAtHeight: (height: number) => Promise.resolve(blocks[height] ?? null),
        getLastBlock: () => Promise.resolve(lastBlock),
    });

    it("should return 'null' for negative timestamp", async () => {
        await expect(testTarget.findLastBlockHeightBefore(-GENESIS_BLOCK_TIMESTAMP))
            .resolves.toBe(null);
    })

    it("should return 'null' for timestamp lower then that of genesis block", async () => {
        await expect(testTarget.findLastBlockHeightBefore(-GENESIS_BLOCK_TIMESTAMP))
            .resolves.toBe(null);
    })

    it("should find the genesis block height given the genesis timestamp + 1", async () => {
        await expect(testTarget.findLastBlockHeightBefore(GENESIS_BLOCK_TIMESTAMP + 1))
            .resolves.toBe(0);
    });

    it("should find the last block height given the last block timestamp + 1", async () => {
        await expect(testTarget.findLastBlockHeightBefore(lastBlock.time + 1))
            .resolves.toBe(blocks.length - 1);
    });

    test.each([
        [ printBlocks(blocks[42], blocks[43]), 42, blocks[43].time - 10 ],
        [ printBlocks(blocks[318], blocks[319]), 318, blocks[319].time - 10 ],
        [ printBlocks(blocks[499], blocks[500]), 499, blocks[500].time - 10 ],
        [ printBlocks(blocks[764], blocks[765]), 764, blocks[765].time - 10 ],
        [ printBlocks(blocks[999]), 999, lastBlock.time + 10 ],
        [ printBlocks(blocks[0]), null, blocks[0].time - 10 ],
        [ printBlocks(blocks[0]), 0, blocks[0].time + 10 ],
    ])("given blocks: %s, should find the block height to be %d for timestamp %d", async (_, expectedHeight, timestamp) => {
        await expect(testTarget.findLastBlockHeightBefore(timestamp))
            .resolves.toBe(expectedHeight);
    });
});