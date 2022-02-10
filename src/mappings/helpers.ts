/* eslint-disable prefer-const */
import {
  Address,
  BigDecimal,
  BigInt,
} from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/MooToken/ERC20";
import { ERC20NameBytes } from "../../generated/MooToken/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/MooToken/ERC20SymbolBytes";
import {
  User,
} from "../../generated/schema";

export const CELO_ADDRESS = "0x471EcE3750Da237f93B8E339c536989b8978a438";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

let tokenDetails = new Map<string, string>()
let tokenDetailsNumber = new Map<string, BigInt>()
// tokenDetails = {}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString("1000000000000000000");
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(18));
}

export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: BigInt
): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal();
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = parseFloat(value.toString());
  const zero = parseFloat(ZERO_BD.toString());
  if (zero == formattedVal) {
    return true;
  }
  return false;
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  let token_key = tokenAddress.toHexString().concat("symbolValue").toString();

  if (tokenDetails.has(token_key)) {
      return tokenDetails.get(token_key)
  }

  // hard coded overrides
  if (tokenAddress.toHexString() == CELO_ADDRESS) {
    return "CELO";
  }

  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = "unknown";
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  tokenDetails.set(token_key, symbolValue)

  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  let token_key = tokenAddress.toHexString().concat("nameValue").toString();

  if (tokenDetails.has(token_key)) {
    return tokenDetails.get(token_key)
  }

  // hard coded overrides
  if (tokenAddress.toHexString() == CELO_ADDRESS) {
    return "Celo Native Asset";
  }

  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }
  tokenDetails.set(token_key, nameValue)
  return nameValue;
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let token_key = tokenAddress.toHexString().concat("totalSupplyResult").toString();

  if (tokenDetailsNumber.has(token_key)) {
    return tokenDetailsNumber.get(token_key)
  }

  let contract = ERC20.bind(tokenAddress);
  // let totalSupplyValue = NaN;
  let totalSupplyResult = contract.totalSupply();
  // log.warning("total supply for address {} {}",[tokenAddress.toHexString(), totalSupplyResult.toString()]);
  // if (!totalSupplyResult.reverted) {
  //   totalSupplyValue = totalSupplyResult as i32;
  // }
  // return BigInt.fromI32(totalSupplyValue as i32);
  tokenDetailsNumber.set(token_key, totalSupplyResult)
  return totalSupplyResult;
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let token_key = tokenAddress.toHexString().concat("decimalValue").toString();

  if (tokenDetailsNumber.has(token_key)) {
    return tokenDetailsNumber.get(token_key)
  }

  let contract = ERC20.bind(tokenAddress);
  // try types uint8 for decimals
  let decimalValue = 0;
  let decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
  }
  tokenDetailsNumber.set(token_key, BigInt.fromI32(decimalValue))

  return BigInt.fromI32(decimalValue);
}

export function createUser(address: Address, token: string, blockTimestamp: BigInt): void {
  let user = User.load(address.toHexString());
  if (!user) {
    user = new User(address.toHexString());
    user.tokens = [ token ];
    user.save();
  } else {
    let isToken = user.tokens.includes(token);
    if (!isToken) {
      user.tokens.push(token);
    }
    user.tokens = user.tokens;
    user.blockTimestamp = blockTimestamp;
    user.save();
  }
}
