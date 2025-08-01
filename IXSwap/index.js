// index.js
import { infuraKeys } from './config/keys.js';
import coinsConfig from './config/coinsConfig.js';

import { BtseApi } from './apis/BtseApi.js';
import { PolygonSwapUSDC } from './apis/PolygonSwapUSDC.js';
import { BaseSwapUSDC } from './apis/BaseSwapUSDC.js';

import { ArbitrageScenarioUSDC } from './ArbitrageScenarioUSDC.js';
import { ArbitrageScenarioBaseUSDC } from './ArbitrageScenarioBaseUSDC.js';

const BTSE_FEE = 0.002; // 0.2% для BTSE

async function runScenariosEndlessly() {
    let round = 0;

    while (true) {
        const currentInfuraKey = infuraKeys[round % infuraKeys.length];
        console.log(`\n*** Раунд ${round + 1}: використовується Infura ключ ${currentInfuraKey} ***`);

        // Спільний BTSE‑клієнт (нульовий бюджет) для отримання стакану цін
        const genericBtseApi = new BtseApi(0, BTSE_FEE);

        // ───────────────────────────────────────────────────────────────
        // 1. IXS / USDC (мережа Polygon)
        // ───────────────────────────────────────────────────────────────
        try {
            const polygonSwapUSDC = new PolygonSwapUSDC(currentInfuraKey);

            const [btseOrderBook, poolUSDCReserves] = await Promise.all([
                genericBtseApi.fetchOrderBook(),
                polygonSwapUSDC.getReserves(),
            ]);

            for (let i = 0; i < coinsConfig.IXS_USDC.length; i++) {
                console.log(`\n=== IXS/USDC сценарій, конфіг №${i} ===`);
                const cfg = coinsConfig.IXS_USDC[i];

                const btseApi = new BtseApi(cfg.buyAmount, BTSE_FEE);
                const scenario = new ArbitrageScenarioUSDC(btseApi, polygonSwapUSDC, cfg);

                const logs = [];

                try {
                    logs.push(await scenario.scenarioThree(btseOrderBook, poolUSDCReserves));
                } catch (err) {
                    const msg = `Помилка у scenarioThree(#${i}): ${err.message}`;
                    console.error(msg);
                    logs.push(msg);
                }

                try {
                    logs.push(await scenario.scenarioFour(btseOrderBook, poolUSDCReserves));
                } catch (err) {
                    const msg = `Помилка у scenarioFour(#${i}): ${err.message}`;
                    console.error(msg);
                    logs.push(msg);
                }

                try {
                    await scenario.sendLogMessage(logs.join('\n\n'));
                    await new Promise((r) => setTimeout(r, 1500));
                } catch (err) {
                    console.error('Помилка надсилання логу (IXS/USDC):', err);
                }
            }
        } catch (err) {
            console.error('Блок IXS/USDC завершився з помилкою:', err);
        }

        // ───────────────────────────────────────────────────────────────
        // 2. BASE / USDC (мережа Base)
        // ───────────────────────────────────────────────────────────────
        try {
            const baseSwapUSDC = new BaseSwapUSDC(currentInfuraKey);

            const [btseOrderBookBase, poolReservesBase] = await Promise.all([
                genericBtseApi.fetchOrderBook(),
                baseSwapUSDC.getReserves(),
            ]);

            for (let i = 0; i < coinsConfig.BASE_USDC.length; i++) {
                console.log(`\n=== BASE/USDC сценарій, конфіг №${i} ===`);
                const cfg = coinsConfig.BASE_USDC[i];

                const btseApiBase = new BtseApi(cfg.buyAmount, BTSE_FEE);
                const scenarioBase = new ArbitrageScenarioBaseUSDC(btseApiBase, baseSwapUSDC, cfg);

                const logs = [];

                try {
                    logs.push(await scenarioBase.scenarioThree(btseOrderBookBase, poolReservesBase));
                } catch (err) {
                    const msg = `Помилка у scenarioThree(Base,#${i}): ${err.message}`;
                    console.error(msg);
                    logs.push(msg);
                }

                try {
                    logs.push(await scenarioBase.scenarioFour(btseOrderBookBase, poolReservesBase));
                } catch (err) {
                    const msg = `Помилка у scenarioFour(Base,#${i}): ${err.message}`;
                    console.error(msg);
                    logs.push(msg);
                }

                try {
                    await scenarioBase.sendLogMessage(logs.join('\n\n'));
                    await new Promise((r) => setTimeout(r, 1500));
                } catch (err) {
                    console.error('Помилка надсилання логу (BASE/USDC):', err);
                }
            }
        } catch (err) {
            console.error('Блок BASE/USDC завершився з помилкою:', err);
        }

        round++;
        console.log('\n*** Завершили всі конфіги, чекаємо 15 секунд перед наступним колом ***');
        await new Promise((res) => setTimeout(res, 15000));
    }
}

(async () => {
    await runScenariosEndlessly();
})();
