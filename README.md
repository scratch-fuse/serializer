
# @scratch-fuse/serializer

Serialize FUSE Scratch IR into Scratch (SB3) workspace format.

This library converts the intermediate representation produced by the
`@scratch-fuse/compiler` into Scratch 3.0-compatible workspace blocks and
related structures. It's intended to be used by build tools or tooling that
emit Scratch projects from a FUSE-based intermediate representation.

## Features

- Convert lists of blocks into an `Sb3Workspace`.
- Serialize a single script (hat + blocks) into a workspace.
- Serialize compiled functions into Scratch procedure definition blocks.
- Deserialize Scratch 3.0 workspaces back into compiler IR format.
- Merge and validate created workspaces.

## Installation

Install from npm (or use the repository source):

```bash
npm install @scratch-fuse/serializer
```

Note: this project expects type definitions compatible with
`@scratch-fuse/compiler` for the input AST/IR types. The compiler is referenced
by the project; ensure your consuming project has the appropriate compiler
package available for TypeScript builds.

## Quick usage

### Serialization (Compiler IR → SB3)

Basic TypeScript example:

```ts
import {
	serializeBlocks,
	serializeScript,
	serializeFunction,
	mergeWorkspaces,
	validateWorkspace
} from '@scratch-fuse/serializer'

// `blocks`, `script` and `func` are objects produced by
// `@scratch-fuse/compiler` (Script, Block, CompiledFunction etc.)
const workspaceA = serializeBlocks(blocks)
const workspaceB = serializeScript(script)
const funcWorkspace = serializeFunction(func)

// Merge several workspaces into a single blocks map
const merged = mergeWorkspaces(workspaceA, workspaceB, funcWorkspace)

// Validate workspace integrity (throws on invalid references)
validateWorkspace(merged)

// `merged` is an `Sb3Workspace` (a map of block-id -> block) ready to be
// inserted into an SB3 target's `blocks` field when building a full project.
```

### Deserialization (SB3 → Compiler IR)

Deserialize Scratch 3.0 projects back into compiler format:

```ts
import {
	Deserializer,
	deserializeBlocks,
	deserializeScript,
	deserializeFunction,
	deserializeAllScripts,
	deserializeAllFunctions
} from '@scratch-fuse/serializer'

// Load a Scratch 3.0 project
const project = JSON.parse(await fs.readFile('project.json', 'utf-8'))
const target = project.targets[0] // Get first target (stage or sprite)

// Method 1: Use convenience functions (creates a new Deserializer internally)
const scripts = deserializeAllScripts(target.blocks)
const functions = deserializeAllFunctions(target.blocks)

// Method 2: Use Deserializer class for advanced usage
// This provides better performance and additional features:
const deserializer = new Deserializer(target.blocks)

// The Deserializer class pre-parses all function definitions
// and maintains a function registry for efficient lookups
console.log('Registered functions:', deserializer.getRegisteredFunctionNames())

// Check if a specific function exists
if (deserializer.hasFunction('myFunction %s')) {
	const func = deserializer.getFunctionByProccode('myFunction %s')
	console.log('Function found:', func.decl.name)
}

// Deserialize all scripts
// When deserializing, procedure_call blocks automatically resolve
// their target functions from the pre-built registry
const allScripts = deserializer.deserializeAllScripts()
allScripts.forEach(script => {
	if (script.hat) {
		console.log('Hat block:', script.hat.opcode)
	}
	console.log('Block count:', script.blocks.length)
})

// Get all functions
const allFunctions = deserializer.deserializeAllFunctions()
allFunctions.forEach(func => {
	console.log('Function:', func.proccode)
	console.log('Parameters:', func.decl.parameters)
})

// For a single script or function
const singleScript = deserializer.deserializeScript()
const singleFunction = deserializer.deserializeFunction()
```

### Key Features of the Deserializer Class

The `Deserializer` class provides several advantages over the standalone functions:

1. **Function Registry**: All custom functions are pre-parsed and cached during initialization
2. **Efficient Lookups**: Functions are resolved by proccode without re-parsing
3. **Procedure Call Resolution**: When deserializing `procedures_call` blocks, the target function is automatically resolved from the registry
4. **State Management**: Tracks processed blocks to avoid duplicates and infinite loops
5. **Reusable**: Create once, deserialize multiple scripts/functions without re-parsing

```

### Example: Parse a Scratch project

The package includes a built-in example function:

```ts
import { example } from '@scratch-fuse/serializer'

// Parse a Scratch 3.0 project file
const result = await example('./path/to/project.json')
console.log('Scripts:', result.scripts)
console.log('Functions:', result.functions)
```

For plain JavaScript import (CommonJS) consumers, require the built package
(`dist/index.cjs`) or use a bundler that resolves the package `main`/`module`.

## API (high level)

### Serialization Functions

- `serializeBlocks(blocks: Block[]): Sb3Workspace` — serialize a flat list of
	blocks into an SB3 workspace map.
- `serializeScript(script: Script): Sb3Workspace` — serialize a script which may
	include a hat (event) block and its body.
- `serializeFunction(func: CompiledFunction): Sb3Workspace` — serialize a
	compiled function (procedure) into a pair of definition/prototype blocks and
	its parameter reporters.
- `mergeWorkspaces(...workspaces: Sb3Workspace[]): Sb3Workspace` — shallow-merge
	multiple workspaces into one map.
- `validateWorkspace(workspace: Sb3Workspace): void` — runtime validation to
	ensure `next`, `parent`, and input references point to existing block ids.

### Deserialization Functions

- `Deserializer` — A class for managing workspace deserialization with advanced
	features:
	- **Constructor**: `new Deserializer(workspace: Sb3Workspace)` — Creates a deserializer
		instance and pre-parses all function definitions.
	- **Instance Methods**:
		- `deserializeBlocks(): Block[]` — Deserialize workspace into blocks.
		- `deserializeScript(): Script` — Deserialize a single script.
		- `deserializeFunction(): CompiledFunction` — Deserialize a single function.
		- `deserializeAllScripts(): Script[]` — Deserialize all scripts.
		- `deserializeAllFunctions(): CompiledFunction[]` — Deserialize all functions.
		- `getRegisteredFunctionNames(): string[]` — Get all function proccodes.
		- `hasFunction(proccode: string): boolean` — Check if a function exists.
		- `getFunctionByProccode(proccode: string): CompiledFunction | null` — Get a function by proccode.
		- `getBlockFunction(blockId: string): CompiledFunction | null` — Get the function referenced by a procedures_call block.
- `deserializeBlocks(workspace: Sb3Workspace): Block[]` — deserialize a workspace
	into a flat list of blocks.
- `deserializeScript(workspace: Sb3Workspace): Script` — deserialize a workspace
	into a single script with optional hat block.
- `deserializeFunction(workspace: Sb3Workspace): CompiledFunction` — deserialize
	a function definition from a workspace.
- `deserializeAllScripts(workspace: Sb3Workspace): Script[]` — deserialize all
	top-level scripts from a workspace.
- `deserializeAllFunctions(workspace: Sb3Workspace): CompiledFunction[]` — 
	deserialize all custom function definitions from a workspace.

> **Note**: The standalone functions create a new `Deserializer` instance internally.
> For better performance when deserializing multiple items, use the `Deserializer`
> class directly.

Types and low-level SB3 shapes are exported from the package (see `src/base.ts`)
and include `Sb3Block`, `Sb3Workspace`, `Sb3Input`, `Sb3Field` and related
structures.

## Files overview

- `src/index.ts` — package exports and example function.
- `src/serializer.ts` — core serialization logic (IR → SB3).
- `src/deserializer.ts` — core deserialization logic (SB3 → IR).
- `src/base.ts` — TypeScript types that model SB3 blocks, inputs and workspaces.
- `src/uid.ts` — a small unique id generator (derived from Blockly).

## Development

Install dev dependencies and build with the scripts provided in
`package.json`:

```bash
# install deps
npm install

# build once
npm run build

# development (watch)
npm run dev

# type check only
npm run lint:type

# format
npm run format
```

There are currently no tests included in the repository (see the `test`
script in `package.json`).

## Contributing

Issues and pull requests are welcome. When opening an issue, please provide a
clear reproduction case (input IR and expected SB3 shape) where possible.

The project uses the MPL-2.0 license — see `LICENSE` for details.

## License & authors

- Author: FurryR
- License: MPL-2.0
- Repository: https://github.com/scratch-fuse/serializer

