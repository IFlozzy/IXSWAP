// ArbitrageScenarioBaseUSDC.js
import { sendLogMessage, sendMainMessage } from './telegram/telegramBot.js';

export class ArbitrageScenarioBaseUSDC {
    /**
     * @param {Object} btseApi - API для взаємодії з BTSE (для купівлі/продажу IXS)
     * @param {Object} baseSwapUSDC - API для мережі Base для обміну IXS/USDC
     * @param {Object} config - Конфігурація, наприклад: { buyAmount: 300, profitThresholdPercent: 2 }
     */
    constructor(btseApi, baseSwapUSDC, config) {
        this.btseApi = btseApi;
        this.baseSwapUSDC = baseSwapUSDC;
        this.config = config;
    }

    async sendLogMessage(text) {
        // Затримка 1 секунда для уникнення rate limit
        await new Promise(res => setTimeout(res, 1000));
        await sendLogMessage(text);
    }

    async sendMainMessage(text) {
        await sendMainMessage(text);
    }

    // Сценарій: BTSE -> BaseSwapUSDC (IXS -> USDC)
    async scenarioThree(btseOrderBook, poolReserves) {
        console.log('=== Сценарій 3 (BASE): BTSE -> BaseSwapUSDC (IXS -> USDC) ===');
        const initialUSDC = this.config.buyAmount;
        // Купівля IXS на BTSE. Переконайтеся, що btseApi.simulateBuyIXS повертає кількість IXS, розраховану правильно
        const ixsBought = await this.btseApi.simulateBuyIXS(btseOrderBook);
        // Свап IXS на USDC через пул BaseSwapUSDC
        const usdcOutput = await this.baseSwapUSDC.swapIXStoUSDC(ixsBought, poolReserves);

        const diff = usdcOutput - initialUSDC;
        const diffPercent = (diff / initialUSDC) * 100;
        const threshold = this.config.profitThresholdPercent;

        const messageLog =
            `Профіт ${diff.toFixed(2)} USDC (${diffPercent.toFixed(2)}%)
BTSE -> BaseSwapUSDC (IXS -> USDC)
BTSE: Куплено IXS ~ ${ixsBought.toFixed(2)} за ${initialUSDC.toFixed(2)} USDC
Swap: ${ixsBought.toFixed(2)} IXS -> ${usdcOutput.toFixed(6)} USDC`;

        if (diffPercent >= threshold) {
            await this.sendMainMessage(messageLog);
        }
        return messageLog;
    }

    // Сценарій: BaseSwapUSDC (USDC -> IXS) -> BTSE
    async scenarioFour(btseOrderBook, poolReserves) {
        console.log('=== Сценарій 4 (BASE): BaseSwapUSDC (USDC -> IXS) -> BTSE ===');
        const initialUSDC = this.config.buyAmount;
        // Свап USDC на IXS через пул BaseSwapUSDC
        const ixsOutput = await this.baseSwapUSDC.swapUSDCtoIXS(initialUSDC, poolReserves);
        // Продаж отриманих IXS на BTSE
        const usdcReceived = await this.btseApi.simulateSellIXS(ixsOutput, btseOrderBook);

        const diff = usdcReceived - initialUSDC;
        const diffPercent = (diff / initialUSDC) * 100;
        const threshold = this.config.profitThresholdPercent;

        const messageLog =
            `Профіт ${diff.toFixed(2)} USDC (${diffPercent.toFixed(2)}%)
BaseSwapUSDC (USDC -> IXS) -> BTSE
Swap: ${initialUSDC.toFixed(2)} USDC -> ${ixsOutput.toFixed(6)} IXS
BTSE: Продано ${ixsOutput.toFixed(2)} IXS, отримано ~ ${usdcReceived.toFixed(2)} USDC`;

        if (diffPercent >= threshold) {
            await this.sendMainMessage(messageLog);
        }
        return messageLog;
    }
}
