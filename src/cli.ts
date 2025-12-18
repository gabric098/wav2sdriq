#!/usr/bin/env node

import { Command } from 'commander';
import { convert } from './commands/convert';

const program = new Command();

program
  .name('wav2sdriq')
  .description('A Node.js CLI utility')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert WAV files to SDR IQ format')
  .argument('<input>', 'Input WAV file path')
  .option('-o, --output <path>', 'Output file path')
  .option('-s, --sample-rate <rate>', 'Sample rate (Hz)', '48000')
  .option('-f, --format <format>', 'Output format (int16|float32)', 'int16')
  .action(convert);

program.parse(process.argv);
