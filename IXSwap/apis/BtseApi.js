// apis/BtseApi.js
import fetch from 'node-fetch';

export class BtseApi {
    constructor(buyAmountUsdt, tradingFeeRate) {
        this.apiUrl = 'https://api.btse.com/spot/api/v3.2/orderbook/L2?symbol=IXS-USDT&depth=10';
        this.buyAmountUsdt = buyAmountUsdt;
        this.tradingFeeRate = tradingFeeRate;
    }

    async fetchOrderBook() {
        const response = await fetch(this.apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP помилка BTSE: ${response.status}`);
        }
        return await response.json(); // { buyQuote: [...], sellQuote: [...] }
    }

    async simulateBuyIXS(orderBook = null) {
        if (!orderBook) {
            orderBook = await this.fetchOrderBook();
        }
        const bestAsk = orderBook.sellQuote[0];
        if (!bestAsk) {
            throw new Error('sellQuote порожній, немає ордерів на продаж IXS');
        }
        const price = parseFloat(bestAsk.price);
        const usdtForPurchase = this.buyAmountUsdt / (1 + this.tradingFeeRate);
        const ixsBought = usdtForPurchase / price;

        console.log(
            `BTSE: Куплено IXS ~ ${ixsBought.toFixed(2)} за ${this.buyAmountUsdt.toFixed(2)} USDT (fee=${(this.tradingFeeRate * 100).toFixed(2)}%)`
        );
        return ixsBought;
    }

    async simulateSellIXS(ixsAmount, orderBook = null) {
        if (!orderBook) {
            orderBook = await this.fetchOrderBook();
        }
        const bestBid = orderBook.buyQuote[0];
        if (!bestBid) {
            throw new Error('buyQuote порожній, немає ордерів на купівлю IXS');
        }
        const price = parseFloat(bestBid.price);
        const revenue = ixsAmount * price;
        const totalUSDT = revenue * (1 - this.tradingFeeRate);

        console.log(
            `BTSE: Продано ${ixsAmount.toFixed(2)} IXS, отримано ~ ${totalUSDT.toFixed(2)} USDT (fee=${(this.tradingFeeRate * 100).toFixed(2)}%)`
        );
        return totalUSDT;
    }
}
