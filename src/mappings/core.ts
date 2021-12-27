/* eslint-disable prefer-const */
import { ethereum, log, } from "@graphprotocol/graph-ts";
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
  log.info("handleTransfer 1 ={}",[event.block.number.toString()]);
  let tokenAddress = event.address;
  let token = Token.load(event.address.toHexString());
  if (!token) {
    log.warning("handleTransfer::inside token load case = {}",[event.address.toHexString()]);
    token = new Token(event.address.toHexString());
    token.symbol = fetchTokenSymbol(tokenAddress);
    token.name = fetchTokenName(tokenAddress);
    token.totalSupply = fetchTokenTotalSupply(tokenAddress);
    let decimals = fetchTokenDecimals(tokenAddress);
    token.decimals = decimals;
    token.totalVolume = ZERO_BD;
    token.txCount = ZERO_BI;
    token.gasConsumed = ZERO_BD;
    token.lastUpdatedTimestamp = event.block.timestamp.toI32();
    token.save();
  }
  log.info("handleTransfer 2 ={}",[event.block.number.toString()]);
  token.txCount = token.txCount.plus(ONE_BI);
  createUser(event.parameters[0].value.toAddress(), event.address.toHexString());
  createUser(event.parameters[1].value.toAddress(), event.address.toHexString());
  token.totalSupply = fetchTokenTotalSupply(tokenAddress);
  let tokenDayData = updateTokenDayData(token as Token, event);

  tokenDayData.dailyVolumeToken = tokenDayData.dailyVolumeToken.plus(event.parameters[2].value.toBigInt().toBigDecimal());
  token.totalVolume = token.totalVolume.plus(event.parameters[2].value.toBigInt().toBigDecimal());
  // log.info
  let gasConsumed= event.transaction.gasUsed.times(event.transaction.gasPrice).toBigDecimal();

  token.gasConsumed = token.gasConsumed.plus(gasConsumed);
  tokenDayData.dailyGasConsumed = tokenDayData.dailyGasConsumed.plus(gasConsumed);

  token.lastUpdatedTimestamp = event.block.timestamp.toI32();
  tokenDayData.save();
  token.save();
}
