import promptly from "promptly";
import BlockchainApiAccessor from "./blockchain-api-accessor";
import BlockchainCrawler from "./blockchain-crawler";

(async () => {
    while (true) {
        const timestamp = (await promptly.prompt("Enter the Unix time:", {
            retry: true,
            validator: (value: number | string) => {
                const numericValue = Number(value);
                if (numericValue <= 0) {
                    throw new Error("Must be a positive numeric value")
                }

                return numericValue;
            }
        })) as unknown as number;

        const apiAccessor = new BlockchainApiAccessor();
        const crawler = new BlockchainCrawler(apiAccessor);
        const blockHeight = await crawler.findLastBlockHeightBefore(timestamp);

        console.log(`Found block height ${blockHeight} before the timestamp ${timestamp} after ${apiAccessor.numberOfInvocations()} API invocations`);
    }
})();