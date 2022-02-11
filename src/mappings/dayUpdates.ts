/* eslint-disable prefer-const */
import {  BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
    Token,
    TokenDayData,
} from "../../generated/schema";
import { ONE_BI, ZERO_BD, ZERO_BI } from "./helpers";

export function updateTokenDayData(
    token: Token,
    event: ethereum.Event
): TokenDayData {
    let timestamp = event.block.timestamp.toI32();
    let dayID = timestamp / 86400;
    let dayStartTimestamp = dayID * 86400;
    let tokenDayID = token.id
        .toString()
        .concat("-")
        .concat(BigInt.fromI32(dayID).toString());

    let tokenDayData = TokenDayData.load(tokenDayID);
    if (tokenDayData === null) {
        tokenDayData = new TokenDayData(tokenDayID);
        tokenDayData.date = dayStartTimestamp;
        tokenDayData.token = token.id;
        // tokenDayData.priceUSD = token.derivedCUSD.times(ONE_BD);
        tokenDayData.dailyVolumeToken = ZERO_BD;
        tokenDayData.dailyGasConsumed = ZERO_BD;
        // tokenDayData.dailyVolumeCELO = ZERO_BD;
        // tokenDayData.dailyVolumeUSD = ZERO_BD;
        tokenDayData.dailyTxns = ZERO_BI;
        // tokenDayData.totalLiquidityUSD = ZERO_BD;
    }
    // tokenDayData.priceUSD = token.derivedCUSD.times(ONE_BD);
    // tokenDayData.totalLiquidityToken = token.totalLiquidity;
    // tokenDayData.totalLiquidityUSD = token.totalLiquidity.times(
    //   token.derivedCUSD as BigDecimal
    // );
    tokenDayData.dailyTxns = tokenDayData.dailyTxns.plus(ONE_BI);
    tokenDayData.save();

    /**
     * @todo test if this speeds up sync
     */
    // updateStoredTokens(tokenDayData as TokenDayData, dayID)
    // updateStoredPairs(tokenDayData as TokenDayData, dayPairID)

    return tokenDayData as TokenDayData;
}
