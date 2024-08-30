import { utils } from 'ethers';


/**
 * Decodes a bytes value starting with an address followed by pairs of a uint24 fee and an address.
 * @param {string} encodedData The hex-encoded string representing the bytes value.
 * @returns An array of objects, each with an address and an optional fee (the first object will not have a fee).
 */
export function decodePathData(encodedData: string): Array<{ tokenIn: string, tokenOut: string, fee: number }> {
  // Initialize the result array
  const result: Array<{ tokenIn: string, tokenOut: string, fee: number }> = [];
  
  // Convert the encoded data into a buffer for easier byte manipulation
  const dataBuffer = utils.arrayify(encodedData);
  
  // Start offset at 0, considering the '0x' prefix is part of encodedData and already skipped by arrayify
  let offset = 0;

  // Temporarily store the first tokenIn address
  let tokenIn = utils.hexlify(dataBuffer.slice(offset, offset + 20));
  tokenIn = utils.getAddress(tokenIn); // Normalize and checksum the address
  offset += 20; // Move past this address
  // Process the data until we don't have enough bytes for a full cycle (address + uint24 + address)
  while (offset + 23 <= dataBuffer.length) { // 20 bytes for address + 3 bytes for uint24 fee
    // Decode uint24 fee, 3 bytes
    const feeBytes = utils.hexDataSlice(encodedData, offset, offset + 3);
    const fee = parseInt(feeBytes, 16);
    offset += 3; // Move past the fee

    // Decode the tokenOut address, 20 bytes
    let tokenOut = utils.hexlify(dataBuffer.slice(offset, offset + 20));
    tokenOut = utils.getAddress(tokenOut); // Normalize and checksum the address
    // Push the decoded data to the result array
    result.push({ tokenIn, tokenOut, fee });

    // Prepare for the next cycle
    tokenIn = tokenOut; // The current tokenOut becomes the next tokenIn
    offset += 20; // Move past the current tokenOut address
  }

  return result;
}


/**
 * Calculates the route length of a bytes value starting with an address followed by pairs of a uint24 fee and an address.
 * @param {string} encodedData The hex-encoded string representing the bytes value.
 * @returns A number, the number of pools used in the path.
 */
export const pathLength = (
    encodedData: string,
): number  => {
    const cleanPath = encodedData.startsWith('0x') ? encodedData.substring(2) : encodedData;
    const OFFSET = 23;
    const path_length = Math.max(0, (cleanPath.length / 2) - 20) / OFFSET;
    return path_length;
};
