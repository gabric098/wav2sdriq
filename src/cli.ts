#!/usr/bin/env node

import { Command } from 'commander';
import { convert } from './commands/convert';

const program = new Command();

program.name('wav2sdriq').description('A Node.js CLI utility').version('1.0.0');

program
  .command('convert')
  .description('Convert WAV files to SDR IQ format')
  .argument('<input>', 'Input WAV file path')
  .requiredOption('--output <path>', 'Output file path')
  .requiredOption('--center-frequency <frequency>', 'Center frequency (Hz)')
  .requiredOption('--start-time <time>', 'Start time in ISO 8601 format')
  .requiredOption('--end-time <time>', 'End time in ISO 8601 format')
  .option('--ad-frequency <frequency>', 'A/D sample frequency before downsampling (Hz)')
  .option('--if-frequency <frequency>', 'IF frequency if an external down converter is used (Hz)')
  .option(
    '--bandwidth <frequency>',
    'Displayable bandwidth if you want to limit the display to less than Nyquist band (Hz)'
  )
  .option('--iq-offset <offset>', "DC offset of the I and Q channels in 1/1000's of a count")
  .option('--iq-mode <mode>', 'IQ mode (0=UNKNOWN, 1=LEFT, 2=RIGHT, 3=LEFTRIGHT, 4=IQ, 5=QI)', '4')
  .option('--w-level-diff <diff>', 'wLevelDiff value (in range -32768 to 32768)')
  .option('--center-frq-hi <frequency>', 'Center frequency high part (Hz)')
  .option('--next-filename <filename>', 'Next filename for multipart recording')
  .option('--prev-filename <filename>', 'Previous filename for multipart recording')
  .action(convert);

program.parse(process.argv);
