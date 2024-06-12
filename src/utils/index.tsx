
export function shortenString(str: string, length?: number): string {
  if (str.length <= (length || 8)) {
    return str;
  }
  const start = str.slice(0, 4);
  const end = str.slice(-4);
  return `${start}...${end}`;
}
export function wait(seconds = 10) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

export function stringToHex(str: string) {
  return Buffer.from(str.toLowerCase(), "utf-8").toString("hex");
}

export function formatNumber(num: number) {
  if (num >= 1e12) {
    // Trillions
    return (num / 1e12).toFixed(1) + "T";
  } else if (num >= 1e9) {
    // Billions
    return (num / 1e9).toFixed(1) + "B";
  } else if (num >= 1e6) {
    // Millions
    return (num / 1e6).toFixed(1) + "M";
  } else if (num >= 1e3) {
    // Thousands
    return (num / 1e3).toFixed(1) + "K";
  } else {
    let precision = 3;
    if (num % 10 === 0) {
      precision = 0;
    }
    return num.toFixed(precision).replace(/(\.\d*[1-9])0+$|\.0*$/, "$1");
  }
}

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export class CustomError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

export const formattedJsonString = (item: any) => {
  if (typeof item === "string") {
    return item.replace(/[\n\r]/g, "\\n");
  }

  return JSON.stringify(
    item,
    (key, value) => {
      if (typeof value === "string") {
        return value.replace(/[\n\r]/g, "\\n");
      }
      return value;
    },
    2
  );
};

import axios from "axios";
import mongoose from "mongoose";





export const determineTypesFromId = (id: string): string[] => {
  // Check for Bitcoin address
  const bitcoinAddressRegex = /^bc1[a-z0-9]+$/;
  if (bitcoinAddressRegex.test(id)) {
    if (id.length === 4) return ["CBRC-20", "address"];
    return ["address"];
  }

  if (!isNaN(Number(id))) {
    return ["inscription number"];
  }

  // Check if ID is an inscription_id
  const inscriptionRegex = /[0-9a-fA-F]{64}i[0-9]+$/;
  if (inscriptionRegex.test(id)) {
    return ["inscription id"];
  }

  // Check if ID is a sha
  const shaRegex = /^[0-9a-fA-F]{64}$/;
  if (shaRegex.test(id)) {
    return ["sha"];
  }

  // Check for strings ending with ' token'
  const tokenRegex = /\btoken$/i;
  if (tokenRegex.test(id)) {
    return ["token"];
  }

  if (/(\d+\.bitmap)$/.test(id)) {
    return ["bitmap"];
  }

  // Add a new check for string.string pattern
  const stringDotStringRegex = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;
  if (stringDotStringRegex.test(id)) {
    return ["domain"];
  }

  // Check if ID is a normal string without special characters
  const normalStringRegex = /^[a-zA-Z0-9]*$/;
  if (normalStringRegex.test(id)) {
    return [
      "CBRC-20",
      "collection",
      "sat name",
      "content",
      "address",
      "content-type",
    ];
  }

  // Check for file extension patterns (single or combined with '|')
  const extensionRegex = /^[a-z0-9]+(\|[a-z0-9]+)?$/i;
  if (extensionRegex.test(id)) {
    return ["content-type", "content"];
  }

  // Fallback for normal strings
  return ["CBRC-20", "collection", "content"];
};

export async function getBTCPriceInDollars() {
  const providers = [
    "https://mempool.space/api/v1/prices",
    "https://mempool.ordinalnovus.com/api/v1/prices",
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const data = await response.json();
      const priceInDollars = Number(data["USD"]);
      console.log("BTC Price in USD:", priceInDollars);
      return priceInDollars;
    } catch (error) {
      console.error("Error fetching BTC price from", url, ":", error);
    }
  }

  console.error("All providers failed to return BTC price");
  return null;
}

export function calculateBTCCostInDollars(btcAmount: number, btcPrice: number) {
  if (
    typeof btcAmount !== "number" ||
    typeof btcPrice !== "number" ||
    btcAmount < 0
  ) {
    throw new Error(
      "Invalid input. Both arguments should be positive numbers."
    );
  }

  const btcCostInDollars = btcAmount * btcPrice;
  return btcCostInDollars < 0.1
    ? btcCostInDollars.toFixed(5)
    : btcCostInDollars.toFixed(2);
}

// Function to determine the base URL using a lighter HEAD request
const getBaseUrl = async (network: string) => {
  try {
    if (network !== "testnet") {
      // Attempt to make a HEAD request to the primary URL
      await axios.head(
        "https://mempool.ordinalnovus.com/api/v1/fees/recommended"
      );
      return "https://mempool.ordinalnovus.com";
    } else {
      return "https://mempool.space";
    }
  } catch (error: any) {
    // Fallback URL if the primary isn't reachable
    console.log("Using fallback URL due to error:", error.message);
    return "https://mempool.space";
  }
};



// Function to convert price from satoshi to Bitcoin
export const convertSatToBtc = (priceInSat: number) => {
  return priceInSat / 100000000; // 1 BTC = 100,000,000 SAT
};

export function convertBtcToSat(priceInSat = 0): number {
  return priceInSat * 1e8; // 1 BTC = 100,000,000 SAT
}

export function ecdsaPublicKeyToSchnorr(pubKey: Uint8Array) {
  if (pubKey.byteLength !== 33) throw new Error("Invalid public key length");
  return pubKey.slice(1);
}

export function base64ToHex(str: string) {
  return atob(str)
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

export function base64ToBytes(base64: string) {
  const buffer = Buffer.from(base64, "base64");
  return new Uint8Array(buffer);
}



export function domain_format_validator(input: string) {
  // Check for leading and trailing whitespaces or newlines
  if (/^\s/u.test(input)) {
    return false;
  }

  // Convert to lowercase and trim whitespace
  input = input.toLowerCase().trim();

  // Check if content is a bitmap pattern (number followed by .bitmap)
  const bitmapPattern = /^\d+\.bitmap$/;
  if (bitmapPattern.test(input)) {
    return false;
  }
  // Check if input contains a period (to distinguish between name and namespace)
  const containsPeriod = (input.match(/\./g) || []).length === 1;

  if (containsPeriod) {
    // Validating as a name
    // Split the input at the first whitespace or newline
    // This is now removed since we handle leading and trailing spaces/newlines above
    // input = input.split(/\s|\n/)[0];

    // Validate that there is only one period in the name
    if ((input.match(/\./g) || []).length !== 1) {
      return false;
    }
  } else {
    return false;
  }

  // Validate UTF-8 characters (including emojis)
  // This regex allows letters, numbers, emojis, and some punctuation
  if (!/^[\p{L}\p{N}\p{P}\p{Emoji}]+$/u.test(input)) {
    return false;
  }

  return true;
}

export function bitmap_format_validator(input: string) {
  const bitmapPattern = /^\d+\.bitmap$/;
  if (bitmapPattern.test(input)) {
    return true;
  } else {
    return false;
  }
}

export function isValueExists(value: any) {
  if (value !== null && value !== undefined) return true;
  else false;
}

export enum OutputCurrency {
  USD = "USD",
  BTC = "BTC",
  SATS = "SATS",
}


export const formatSmallNumber = (
  price: number | mongoose.Types.Decimal128,
  btcPrice: number,
  outputCurrency: "USD" | "BTC" | "SATS" = OutputCurrency.USD
): { price: string; unit: string } => {
  // console.log(
  //   `Received price: ${price}, btcPrice: ${btcPrice}, outputCurrency: ${outputCurrency}`
  // );

  // Early return for zero or invalid values
  if (!price || !btcPrice) {
    // console.log("Invalid price or btcPrice, returning default values.");
    return { price: "0.00", unit: "" };
  }



  // Ensure price is now a number before performing arithmetic operations
  if (typeof price !== "number") {
    console.log("Price type after conversion:", typeof price, price);
    throw new Error("Price must be a number after conversion from Decimal128");
  }

  let normalizedPrice: number;
  let unitLabel: string = "";

  // Initial conversion based on the requested output currency
  switch (outputCurrency) {
    case OutputCurrency.BTC:
      normalizedPrice = price / 100_000_000;
      break;
    case OutputCurrency.SATS:
      normalizedPrice = price;
      break;
    case OutputCurrency.USD:
      normalizedPrice = (price / 100_000_000) * btcPrice;
      break;
    default:
      console.error("Unsupported currency type");
      throw new Error("Unsupported currency type");
  }

  // console.log(`Normalized price after initial conversion: ${normalizedPrice}`);
  if (price > 0 && price <= 5) {
    unitLabel = "1000";
    normalizedPrice *= 1000;
  }
  if (price > 0 && price <= 0.1) {
    unitLabel = "10K";
    normalizedPrice *= 10000;
  }
  if (price > 0 && price < 0.0001) {
    unitLabel = "100K";
    normalizedPrice *= 100000;
  }

  // console.log(`Scaled price: ${normalizedPrice}, unit: ${unitLabel}`);

  // Determine decimal places based on currency
  const decimalPlaces =
    outputCurrency === OutputCurrency.BTC
      ? 8
      : outputCurrency === OutputCurrency.USD
      ? 2
      : normalizedPrice < 1
      ? 6
      : 0;

  // Final formatted price
  const formattedPrice = normalizedPrice.toFixed(decimalPlaces);
  // console.log(`Final formatted price: ${formattedPrice} ${unitLabel}`);

  return {
    price: formattedPrice,
    unit: unitLabel,
  };
};