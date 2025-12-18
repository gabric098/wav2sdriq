# wav2sdriq

A Node.js CLI utility built with TypeScript.

## Installation

```bash
npm install
```

## Development

Build the project:
```bash
npm run build
```

Run in development mode:
```bash
npm run dev -- greet --name YourName
```

Run the built CLI:
```bash
npm start -- greet --name YourName
```

Watch mode (auto-rebuild on changes):
```bash
npm run watch
```

## Usage

After building, you can run the CLI with:

```bash
node dist/cli.js greet --name YourName
```

## Commands

- `greet` - Greet the user
  - `-n, --name <name>` - Name to greet (default: "World")

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run CLI in development mode with ts-node
- `npm start` - Run the compiled CLI
- `npm run watch` - Watch mode for development
- `npm run lint` - Lint TypeScript files
- `npm run format` - Format code with Prettier

## Project Structure

```
.
├── src/
│   ├── cli.ts           # CLI entry point
│   ├── index.ts         # Main export file
│   └── commands/
│       └── greet.ts     # Example command
├── dist/                # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```
