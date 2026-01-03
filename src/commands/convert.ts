import * as fs from 'fs';
import * as path from 'path';
import { createAuxiSection } from '../utils/auxi';

const STANDARD_WAV_HEADER_SIZE = 36;

/**
 * Extracts the Wav file header up to (but not including) the "data" chunk.
 * @param filePath
 * @returns
 */
const extractHeader = async (filePath: string): Promise<Buffer> => {
  const fileHandle = await fs.promises.open(filePath, 'r');

  try {
    const headerChunks: Buffer[] = [];
    const buffer = Buffer.alloc(1);
    let position = 0;
    const dataMarker = Buffer.from('data');
    const recentBytes: number[] = [];

    // Read byte by byte until we find "data"
    let dataChunkFound = false;
    while (!dataChunkFound) {
      const { bytesRead } = await fileHandle.read(buffer, 0, 1, position);

      if (bytesRead === 0) {
        throw new Error('End of file reached without finding data chunk');
      }

      headerChunks.push(Buffer.from(buffer));
      recentBytes.push(buffer[0]);

      // Keep only last 4 bytes for comparison
      if (recentBytes.length > 4) {
        recentBytes.shift();
      }

      // Check if we found "data"
      if (recentBytes.length === 4) {
        const recentBuffer = Buffer.from(recentBytes);
        if (recentBuffer.equals(dataMarker)) {
          // Remove the last 4 bytes ("data" marker) from the header
          headerChunks.splice(-4);
          dataChunkFound = true;
        }
      }

      position++;
    }

    return Buffer.concat(headerChunks);
  } finally {
    await fileHandle.close();
  }
};

const replaceHeader = async (
  inputPath: string,
  outputPath: string,
  bytesToRemove: number,
  newHeader: Buffer<ArrayBuffer>
): Promise<void> => {
  // Step 1: Copy input file to output file
  await fs.promises.copyFile(inputPath, outputPath);

  // Step 2: Read the output file, skipping the bytes to remove
  const fileHandle = await fs.promises.open(outputPath, 'r');
  let remainingData: Buffer;

  try {
    const stats = await fileHandle.stat();
    const fileSize = stats.size;

    if (bytesToRemove > fileSize) {
      throw new Error(`Cannot remove ${bytesToRemove} bytes from file of size ${fileSize}`);
    }

    const remainingSize = fileSize - bytesToRemove;
    remainingData = Buffer.alloc(remainingSize);

    // Read from position bytesToRemove to end of file
    await fileHandle.read(remainingData, 0, remainingSize, bytesToRemove);
  } finally {
    await fileHandle.close();
  }

  // Step 3: Write new header + remaining data to output file
  const writeHandle = await fs.promises.open(outputPath, 'w');

  try {
    // Use the Buffer directly (no conversion needed)
    const headerBuffer = newHeader;

    // Write the new header
    await writeHandle.write(headerBuffer, 0, headerBuffer.length, 0);

    // Write the remaining data
    await writeHandle.write(remainingData, 0, remainingData.length, headerBuffer.length);
  } finally {
    await writeHandle.close();
  }
};

const convert = async (
  input: string,
  options: {
    output?: string;
    centerFrequency: number;
    startTime: string;
    endTime: string;
    adFrequency?: number;
    ifFrequency?: number;
    bandwidth?: number;
    iqOffset?: number;
    iqMode?: number;
    wLevelDiff?: number;
    centerFrqHi?: number;
    nextFilename?: string;
    prevFilename?: string;
  }
) => {
  try {
    const inputPath = path.resolve(input);

    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file does not exist: ${inputPath}`);
      process.exit(1);
    }

    const inputHeader = await extractHeader(inputPath);
    if (inputHeader.length !== STANDARD_WAV_HEADER_SIZE) {
      throw new Error(
        `Unexpected WAV header size: ${inputHeader.length}, not a standard WAV file?`
      );
    }
    const auxiSection = createAuxiSection({
      centerFrequency: options.centerFrequency,
      startDate: new Date(options.startTime),
      endDate: new Date(options.endTime),
      adFrequency: options.adFrequency,
      ifFrequency: options.ifFrequency,
      bandwidth: options.bandwidth,
      iqOffset: options.iqOffset,
      iqMode: options.iqMode,
      wLevelDiff: options.wLevelDiff,
      centerFrqHi: options.centerFrqHi,
      nextFilename: options.nextFilename,
      prevFilename: options.prevFilename,
    });
    const outputHeader = Buffer.concat([inputHeader, auxiSection]);
    await replaceHeader(inputPath, options.output || '', inputHeader.length, outputHeader);

    console.log('Conversion completed successfully');
  } catch (error) {
    console.error('Conversion failed:', error);
    process.exit(1);
  }
};

export { convert };
