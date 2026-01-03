// structure of the auxi chunk for reference. Courtesy of Mario - DG0JBJ
// typedef struct
// {
//   char            chunkID[4];   // ="auxi" (chunk rfspace)
//   unsigned long   chunkSize;    // length of chunk
//   SYSTEMTIME StartTime;
//   SYSTEMTIME StopTime;
//   DWORD   CenterFreq;   //receiver center frequency
//   DWORD   ADFrequency;  //A/D sample frequency before downsampling
//   DWORD   IFFrequency;  //IF freq if an external down converter is used
//   DWORD   Bandwidth;    //displayable BW if you want to limit the display to less than Nyquist band
//   DWORD   IQOffset;     //DC offset of the I and Q channels in 1/1000's of a count
//   DWORD   Unused2;
//   short   wLevelDiff;   // prev: Unused3; now wLevelDiff
//                         // add delta = (wLevelDiff/100) dB to each sample (usually negative)
//                         // each I/Q sample has to be multiplied with 10^( delta / 20 )
//                         //   wLevelDiff in [ -32768 .. +32768 ]
//                         //   => delta   in [ -327.68 .. +327.68 ] dB
//   char    Unused3_C;    //
//   char    IQmode;       // 0=UNKNOWN, 1=LEFT, 2=RIGHT, 3=LEFTRIGHT, 4=IQ, 5=QI
//   DWORD   CenterFrqLo;  //
//   DWORD   CenterFrqHi;  // valid if ( CenterFreq == CenterFrqLo )
//   char    nextfilename[48];   //multipart recording, filename next file, only WinRad/HDSDR
//   char    prevfilename[48];   //multipart recording, filename previous file, HDSDR >= v2.80 only
// }

type AuxiSectionParams = {
  startDate: Date;
  endDate: Date;
  centerFrequency: number;
  adFrequency?: number;
  ifFrequency?: number;
  bandwidth?: number;
  iqOffset?: number;
  levelDiff?: number;
  iqMode?: number;
  wLevelDiff?: number;
  centerFrqHi?: number;
  nextFilename?: string;
  prevFilename?: string;
};

export const createAuxiSection = (params: AuxiSectionParams): Buffer => {
  const {
    startDate,
    endDate,
    centerFrequency,
    adFrequency,
    ifFrequency,
    bandwidth,
    iqOffset,
    wLevelDiff,
    iqMode = 4,
    centerFrqHi,
    prevFilename,
    nextFilename,
  } = params;
  // Total size: 172 bytes
  const buffer = Buffer.alloc(172);
  let offset = 0;

  // Positions 37-40: "auxi" marker (4 bytes)
  buffer.write('auxi', offset, 'ascii');
  offset += 4;

  // Positions 41-44: chunk size as 32-bit integer (4 bytes) to be calculated?
  buffer.writeUInt32LE(164, offset);
  offset += 4;

  // Start time (16 bytes)
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

  if (adFrequency !== undefined) {
    // Positions 81-84: A/D sample frequency as 32-bit integer (4 bytes)
    buffer.writeUInt32LE(adFrequency, offset);
  }
  offset += 4;

  if (ifFrequency !== undefined) {
    // Positions 85-88: IF frequency as 32-bit integer (4 bytes)
    buffer.writeUInt32LE(ifFrequency, offset);
  }
  offset += 4;

  if (bandwidth !== undefined) {
    // Positions 89-92: Bandwidth as 32-bit integer (4 bytes)
    buffer.writeUInt32LE(bandwidth, offset);
  }
  offset += 4;

  if (iqOffset !== undefined) {
    // Positions 93-96: IQ Offset as 32-bit integer (4 bytes)
    buffer.writeUInt32LE(iqOffset, offset);
  }
  offset += 4;

  // unused2 (4 bytes) - already zeroed by Buffer.alloc
  offset += 4;

  if (wLevelDiff !== undefined) {
    // Positions 101-102: wLevelDiff as 16-bit integer (2 bytes)
    buffer.writeInt16LE(wLevelDiff, offset);
  }
  offset += 2;

  // Position 103: Unused3_C (1 byte) - already zeroed by Buffer.alloc
  offset += 1;

  // 1 byte
  if (iqMode !== undefined) {
    buffer.writeUInt8(iqMode, offset);
  }
  offset += 1;

  // Positions 107-110: CenterFrqLo as 32-bit integer (4 bytes)
  buffer.writeUInt32LE(centerFrequency, offset);
  offset += 4;

  if (centerFrqHi !== undefined) {
    // Positions 111-114: CenterFrqHi as 32-bit integer (4 bytes)
    buffer.writeUInt32LE(centerFrqHi, offset);
  }
  offset += 4;

  if (prevFilename) {
    // Positions 116-163: prevfilename (48 bytes)
    buffer.write(prevFilename, offset, 48, 'ascii');
  }
  offset += 48;

  if (nextFilename) {
    // Positions 164-211: nextfilename (48 bytes)
    buffer.write(nextFilename, offset, 48, 'ascii');
  }
  offset += 48;

  return buffer;
};
