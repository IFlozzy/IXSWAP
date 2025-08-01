// apis/PolygonSwapUSDC.js
import { ethers } from 'ethers';

export class PolygonSwapUSDC {
    constructor(infuraKey) {
        this.INFURA_PROJECT_ID = infuraKey;
        this.RPC_URL = `https://polygon-mainnet.infura.io/v3/${this.INFURA_PROJECT_ID}`;

        // Адреса пулу, яка працює з парою IXS/USDC
        this.PAIR_ADDRESS = '0xD093A031df30F186976A1e2936B16d95ca7919D6';
        // Встановлюємо адресу IXS, як у тестовій програмі
        this.TOKEN_IXS = '0x1BA17C639BdaeCd8DC4AAc37df062d17ee43a1b8';
        this.TOKEN_USDC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

        this.DECIMALS_IXS = 18;
        this.DECIMALS_USDC = 6;

        this.UNISWAP_V2_PAIR_ABI = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)"
        ];

        this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
        this.pairContract = new ethers.Contract(this.PAIR_ADDRESS, this.UNISWAP_V2_PAIR_ABI, this.provider);
    }

    async getReserves() {
        // Отримуємо адреси токенів із контракту
        const token0 = (await this.pairContract.token0()).toLowerCase();
        const token1 = (await this.pairContract.token1()).toLowerCase();
        const [reserve0, reserve1] = await this.pairContract.getReserves();

        let ixsReserve, usdcReserve;
        // Порівнюємо отриману адресу з нашою для IXS (використовуємо toLowerCase)
        if (token0 === this.TOKEN_IXS.toLowerCase()) {
            ixsReserve = parseFloat(ethers.formatUnits(reserve0, this.DECIMALS_IXS));
            usdcReserve = parseFloat(ethers.formatUnits(reserve1, this.DECIMALS_USDC));
        } else {
            ixsReserve = parseFloat(ethers.formatUnits(reserve1, this.DECIMALS_IXS));
            usdcReserve = parseFloat(ethers.formatUnits(reserve0, this.DECIMALS_USDC));
        }
        return { ixsReserve, usdcReserve };
    }

    getAmountOut(amountIn, reserveIn, reserveOut, fee = 0.003) {
        const amountInWithFee = amountIn * (1 - fee);
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn + amountInWithFee;
        return numerator / denominator;
    }

    async swapIXStoUSDC(inputIXS, reserves = null) {
        if (!reserves) {
            reserves = await this.getReserves();
        }
        const { ixsReserve, usdcReserve } = reserves;
        const outputUSDC = this.getAmountOut(inputIXS, ixsReserve, usdcReserve);
        console.log(`Swap: ${inputIXS.toFixed(2)} IXS -> ~${outputUSDC.toFixed(6)} USDC`);
        return outputUSDC;
    }

    async swapUSDCtoIXS(inputUSDC, reserves = null) {
        if (!reserves) {
            reserves = await this.getReserves();
        }
        const { ixsReserve, usdcReserve } = reserves;
        const outputIXS = this.getAmountOut(inputUSDC, usdcReserve, ixsReserve);
        console.log(`Swap: ${inputUSDC.toFixed(2)} USDC -> ~${outputIXS.toFixed(6)} IXS`);
        return outputIXS;
    }
}
