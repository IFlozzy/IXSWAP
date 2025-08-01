// apis/PolygonSwap.js
import { ethers } from 'ethers';

export class PolygonSwap {
    constructor(infuraKey) {
        this.INFURA_PROJECT_ID = infuraKey;
        this.RPC_URL = `https://polygon-mainnet.infura.io/v3/${this.INFURA_PROJECT_ID}`;

        this.PAIR_ADDRESS = '0x2032a5cc33d740773957c57baca064429ac8dae2';
        this.TOKEN_WIXS = '0x1BA17C639BdaeCd8DC4AAc37df062d17ee43a1b8';
        this.TOKEN_NPT  = '0x306ee01a6bA3b4a8e993fA2C1ADC7ea24462000c';

        this.DECIMALS_WIXS = 18;
        this.DECIMALS_NPT  = 18;

        this.UNISWAP_V2_PAIR_ABI = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)"
        ];

        this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
        this.pairContract = new ethers.Contract(this.PAIR_ADDRESS, this.UNISWAP_V2_PAIR_ABI, this.provider);
    }

    async getReserves() {
        const token0 = (await this.pairContract.token0()).toLowerCase();
        const token1 = (await this.pairContract.token1()).toLowerCase();
        const [reserve0, reserve1] = await this.pairContract.getReserves();

        let wixsReserve, nptReserve;
        if (token0 === this.TOKEN_WIXS.toLowerCase()) {
            wixsReserve = parseFloat(ethers.formatUnits(reserve0, this.DECIMALS_WIXS));
            nptReserve = parseFloat(ethers.formatUnits(reserve1, this.DECIMALS_NPT));
        } else {
            wixsReserve = parseFloat(ethers.formatUnits(reserve1, this.DECIMALS_WIXS));
            nptReserve = parseFloat(ethers.formatUnits(reserve0, this.DECIMALS_NPT));
        }
        return { wixsReserve, nptReserve };
    }

    getAmountOut(amountIn, reserveIn, reserveOut, fee = 0.003) {
        const amountInWithFee = amountIn * (1 - fee);
        const numerator = amountInWithFee * reserveOut;
        const denominator = reserveIn + amountInWithFee;
        return numerator / denominator;
    }

    async swapWIXStoNPT(inputWIXS, reserves = null) {
        if (!reserves) {
            reserves = await this.getReserves();
        }
        const { wixsReserve, nptReserve } = reserves;
        const outputNPT = this.getAmountOut(inputWIXS, wixsReserve, nptReserve);
        console.log(`Swap: ${inputWIXS.toFixed(2)} WIXS -> ~${outputNPT.toFixed(2)} NPT (Uniswap fee 0.3%)`);
        return outputNPT;
    }

    async swapNPTtoWIXS(inputNPT, reserves = null) {
        if (!reserves) {
            reserves = await this.getReserves();
        }
        const { wixsReserve, nptReserve } = reserves;
        const outputWIXS = this.getAmountOut(inputNPT, nptReserve, wixsReserve);
        console.log(`Swap: ${inputNPT.toFixed(2)} NPT -> ~${outputWIXS.toFixed(2)} WIXS (Uniswap fee 0.3%)`);
        return outputWIXS;
    }
}
