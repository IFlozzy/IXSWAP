// apis/BaseSwapUSDC.js
import { ethers } from 'ethers';

export class BaseSwapUSDC {
    constructor(infuraKey) {
        this.INFURA_PROJECT_ID = infuraKey;
        // Використовуємо RPC для Base мережі (якщо Infura підтримує Base, URL може бути таким)
        this.RPC_URL = `https://base-mainnet.infura.io/v3/${this.INFURA_PROJECT_ID}`;

        // Адреса пулу для Base
        this.PAIR_ADDRESS = '0xd22A820DC52F1CAceA7a5c86dA16757F434F43c6';

        // Адреси токенів для Base
        this.TOKEN_IXS = '0xFE550BfFb51EB645EA3b324D772A19AC449E92c5';
        this.TOKEN_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

        // Припускаємо, що для IXS використовується 18 десяткових знаків, для USDC – 6
        this.DECIMALS_IXS = 18;
        this.DECIMALS_USDC = 6;

        // Стандартний ABI для Uniswap V2-подібних пар
        this.UNISWAP_V2_PAIR_ABI = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)"
        ];

        this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
        this.pairContract = new ethers.Contract(this.PAIR_ADDRESS, this.UNISWAP_V2_PAIR_ABI, this.provider);
    }

    async getReserves() {
        // Отримуємо адреси токенів з контракту
        const token0 = (await this.pairContract.token0()).toLowerCase();
        const token1 = (await this.pairContract.token1()).toLowerCase();
        const [reserve0, reserve1] = await this.pairContract.getReserves();

        let ixsReserve, usdcReserve;
        // Якщо token0 співпадає з адресою IXS – резерв IXS з reserve0, а USDC з reserve1, інакше навпаки
        if (token0 === this.TOKEN_IXS.toLowerCase()) {
            ixsReserve = parseFloat(ethers.formatUnits(reserve0, this.DECIMALS_IXS));
            usdcReserve = parseFloat(ethers.formatUnits(reserve1, this.DECIMALS_USDC));
        } else {
            ixsReserve = parseFloat(ethers.formatUnits(reserve1, this.DECIMALS_IXS));
            usdcReserve = parseFloat(ethers.formatUnits(reserve0, this.DECIMALS_USDC));
        }
        return { ixsReserve, usdcReserve };
    }

    // Стандартний розрахунок кількості вихідного токену із врахуванням комісії
    getAmountOut(amountIn, reserveIn, reserveOut, fee = 0.003) {
        const amountInWithFee = amountIn * (1 - fee);
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn + amountInWithFee;
        return numerator / denominator;
    }

    // Метод для обміну IXS на USDC
    async swapIXStoUSDC(inputIXS, reserves = null) {
        if (!reserves) {
            reserves = await this.getReserves();
        }
        const { ixsReserve, usdcReserve } = reserves;
        const outputUSDC = this.getAmountOut(inputIXS, ixsReserve, usdcReserve);
        console.log(`BaseSwap: ${inputIXS.toFixed(2)} IXS -> ~${outputUSDC.toFixed(6)} USDC`);
        return outputUSDC;
    }

    // Метод для обміну USDC на IXS
    async swapUSDCtoIXS(inputUSDC, reserves = null) {
        if (!reserves) {
            reserves = await this.getReserves();
        }
        const { ixsReserve, usdcReserve } = reserves;
        const outputIXS = this.getAmountOut(inputUSDC, usdcReserve, ixsReserve);
        console.log(`BaseSwap: ${inputUSDC.toFixed(2)} USDC -> ~${outputIXS.toFixed(6)} IXS`);
        return outputIXS;
    }
}
