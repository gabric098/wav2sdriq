import * as fs from 'fs';
import * as path from 'path';

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

const createAuxiSection = (
  startDate: Date,
  endDate: Date,
  centerFrequency: number
): Buffer => {
  // Total size: 348 bytes (positions 37-384 when concatenated)
  const buffer = Buffer.alloc(172);
  let offset = 0;

  // Positions 37-40: "auxi" marker (4 bytes)
  buffer.write('auxi', offset, 'ascii');
  offset += 4;

  // Positions 41-44: 164 as 32-bit integer (4 bytes)
  buffer.writeUInt32LE(164, offset);
  offset += 4;

  // Start timestamp (16 bytes)
  buffer.writeUInt16LE(startDate.getFullYear(), offset); // Position 45-46: YEAR
  offset += 2;
  buffer.writeUInt16LE(startDate.getMonth() + 1, offset); // Position 47-48: MONTH (1-12)
  offset += 2;
  buffer.writeUInt16LE(startDate.getDay(), offset); // Position 49-50: DAY OF THE WEEK (0-6)
  offset += 2;
  buffer.writeUInt16LE(startDate.getDate(), offset); // Position 51-52: DAY OF THE MONTH
  offset += 2;
  buffer.writeUInt16LE(startDate.getHours(), offset); // Position 53-54: HOURS
  offset += 2;
  buffer.writeUInt16LE(startDate.getMinutes(), offset); // Position 55-56: MINUTES
  offset += 2;
  buffer.writeUInt16LE(startDate.getSeconds(), offset); // Position 57-58: SECONDS
  offset += 2;
  buffer.writeUInt16LE(startDate.getMilliseconds(), offset); // Position 59-60: MILLISECONDS
  offset += 2;

  // End timestamp (16 bytes)
  buffer.writeUInt16LE(endDate.getFullYear(), offset); // Position 61-62: YEAR
  offset += 2;
  buffer.writeUInt16LE(endDate.getMonth() + 1, offset); // Position 63-64: MONTH (1-12)
  offset += 2;
  buffer.writeUInt16LE(endDate.getDay(), offset); // Position 65-66: DAY OF THE WEEK (0-6)
  offset += 2;
  buffer.writeUInt16LE(endDate.getDate(), offset); // Position 67-68: DAY OF THE MONTH
  offset += 2;
  buffer.writeUInt16LE(endDate.getHours(), offset); // Position 69-70: HOURS
  offset += 2;
  buffer.writeUInt16LE(endDate.getMinutes(), offset); // Position 71-72: MINUTES
  offset += 2;
  buffer.writeUInt16LE(endDate.getSeconds(), offset); // Position 73-74: SECONDS
  offset += 2;
  buffer.writeUInt16LE(endDate.getMilliseconds(), offset); // Position 75-76: MILLISECONDS
  offset += 2;

  // Positions 77-80: Center frequency as 32-bit integer (4 bytes)
  buffer.writeUInt32LE(centerFrequency, offset);
  offset += 4;

  // Positions 81-102: Unused (22 bytes) - already zeroed by Buffer.alloc
  offset += 22;

  // Positions 103-104: 1024 as 16-bit integer (2 bytes)
  buffer.writeUInt16LE(1024, offset);
  offset += 2;

  // Positions 105-108: Center frequency as 32-bit integer (4 bytes)
  buffer.writeUInt32LE(centerFrequency, offset);

  return buffer;
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
      throw new Error(
        `Cannot remove ${bytesToRemove} bytes from file of size ${fileSize}`
      );
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
    await writeHandle.write(
      remainingData,
      0,
      remainingData.length,
      headerBuffer.length
    );
  } finally {
    await writeHandle.close();
  }
};

const convert = async (
  input: string,
    options: { output?: string; sampleRate?: string; format?: string }
) => {
  try {
    const inputPath = path.resolve(input);
    // const outputPath = options.output || input.replace('.wav', '.iq');

    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file does not exist: ${inputPath}`);
      process.exit(1);
    }

    const inputHeader = await extractHeader(inputPath);
    const auxiSection = createAuxiSection(new Date(), new Date(Date.now() + 5 * 60 * 1000), 450000); // Example center frequency
    const outputHeader = Buffer.concat([inputHeader, auxiSection]);
    await replaceHeader(inputPath, options.output || '', inputHeader.length, outputHeader);

    console.log('Conversion completed successfully');
  } catch (error) {
    console.error('Conversion failed:', error);
    process.exit(1);
  }
};

export { convert };
