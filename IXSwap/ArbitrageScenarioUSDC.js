// ArbitrageScenarioUSDC.js
import { sendLogMessage, sendMainMessage } from './telegram/telegramBot.js';

export class ArbitrageScenarioUSDC {
    constructor(btseApi, polygonSwapUSDC, config) {
        this.btseApi = btseApi;
        this.polygonSwapUSDC = polygonSwapUSDC;
        // Конфігурація для IXS/USDC, наприклад: { buyAmount: 300, profitThresholdPercent: 2 }
        this.config = config;
    }

    async sendLogMessage(text) {
        // Затримка 1 секунда перед відправкою лог-повідомлення для уникнення rate limit
        await new Promise(res => setTimeout(res, 1000));
        await sendLogMessage(text);
    }

    async sendMainMessage(text) {
        await sendMainMessage(text);
    }

    // Сценарій: BTSE -> PolygonSwapUSDC (IXS -> USDC)
    async scenarioThree(btseOrderBook, poolReserves) {
        console.log('=== Сценарій 3: BTSE -> PolygonSwapUSDC (IXS -> USDC) ===');
        const initialUSDC = this.config.buyAmount;
        // Купівля IXS на BTSE. Переконайтеся, що btseApi.simulateBuyIXS повертає кількість IXS, розраховану правильно
        const ixsBought = await this.btseApi.simulateBuyIXS(btseOrderBook);
        // Свап IXS на USDC через новий пул
        const usdcOutput = await this.polygonSwapUSDC.swapIXStoUSDC(ixsBought, poolReserves);

        const diff = usdcOutput - initialUSDC;
        const diffPercent = (diff / initialUSDC) * 100;
        const threshold = this.config.profitThresholdPercent;

        const messageLog =
            `Профіт ${diff.toFixed(2)} USDC ( ${diffPercent.toFixed(2)}% )
BTSE -> PolygonSwapUSDC (IXS -> USDC)
BTSE: Куплено IXS ~ ${ixsBought.toFixed(2)} за ${initialUSDC.toFixed(2)} USDC
Swap: ${ixsBought.toFixed(2)} IXS -> ${usdcOutput.toFixed(6)} USDC`;

        if (diffPercent >= threshold) {
            await this.sendMainMessage(messageLog);
        }
        return messageLog;
    }

    // Сценарій: PolygonSwapUSDC (USDC -> IXS) -> BTSE
    async scenarioFour(btseOrderBook, poolReserves) {
        console.log('=== Сценарій 4: PolygonSwapUSDC (USDC -> IXS) -> BTSE ===');
        const initialUSDC = this.config.buyAmount;
        // Свап USDC на IXS через новий пул
        const ixsOutput = await this.polygonSwapUSDC.swapUSDCtoIXS(initialUSDC, poolReserves);
        // Продаж отриманих IXS на BTSE
        const usdcReceived = await this.btseApi.simulateSellIXS(ixsOutput, btseOrderBook);

        const diff = usdcReceived - initialUSDC;
        const diffPercent = (diff / initialUSDC) * 100;
        const threshold = this.config.profitThresholdPercent;

        const messageLog =
            `Профіт ${diff.toFixed(2)} USDC ( ${diffPercent.toFixed(2)}% )
PolygonSwapUSDC (USDC -> IXS) -> BTSE
Swap: ${initialUSDC.toFixed(2)} USDC -> ${ixsOutput.toFixed(6)} IXS
BTSE: Продано ${ixsOutput.toFixed(2)} IXS, отримано ~ ${usdcReceived.toFixed(2)} USDC`;

        if (diffPercent >= threshold) {
            await this.sendMainMessage(messageLog);
        }
        return messageLog;
    }
}
