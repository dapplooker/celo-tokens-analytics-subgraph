/* eslint-disable prefer-const */
import { ethereum,
    log,
} from "@graphprotocol/graph-ts";

import {
    Token,
} from "../../generated/schema";

import {
    updateTokenDayData,
} from "./dayUpdates";

import {
    createUser,
    ONE_BI,
    ZERO_BD,
    fetchTokenDecimals,
    fetchTokenName,
    fetchTokenSymbol,
    fetchTokenTotalSupply,
    ZERO_BI,
} from "./helpers";


export function handleTransfer(event: ethereum.Event): void {
    log.info("Event block number: {}",[event.block.number.toString()]);

    let tokenAddress = event.address;
    let token = Token.load(event.address.toHexString());
    if (!token) {
        log.warning("Creating new token with address {}",[event.address.toHexString()]);
        token = new Token(event.address.toHexString());
        token.symbol = fetchTokenSymbol(tokenAddress);
        token.name = fetchTokenName(tokenAddress);
        token.totalSupply = fetchTokenTotalSupply(tokenAddress);
        token.decimals = fetchTokenDecimals(tokenAddress);;
        token.totalVolume = ZERO_BD;
        token.txCount = ZERO_BI;
        token.gasConsumed = ZERO_BD;
        token.blockTimestamp = event.block.timestamp;
        token.save();
    } else {
        log.warning("Token with address {} already present",[event.address.toHexString()]);
    }

    log.info("Proceeding with other set of steps for block {}", [event.block.number.toString()]);

    token.txCount = token.txCount.plus(ONE_BI);
    createUser(event.parameters[0].value.toAddress(), event.address.toHexString(), event.block.timestamp);
    createUser(event.parameters[1].value.toAddress(), event.address.toHexString(), event.block.timestamp);

    token.totalSupply = fetchTokenTotalSupply(tokenAddress);
    let tokenDayData = updateTokenDayData(token as Token, event);
    tokenDayData.dailyVolumeToken = tokenDayData.dailyVolumeToken.plus(event.parameters[2].value.toBigInt().toBigDecimal());
    token.totalVolume = token.totalVolume.plus(event.parameters[2].value.toBigInt().toBigDecimal());

    let gasConsumed = event.transaction.gasLimit.times(event.transaction.gasPrice).toBigDecimal();
    token.gasConsumed = token.gasConsumed.plus(gasConsumed);
    tokenDayData.dailyGasConsumed = tokenDayData.dailyGasConsumed.plus(gasConsumed);

    token.blockTimestamp = event.block.timestamp;

    tokenDayData.save();
    token.save();
}
