
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

For plain JavaScript import (CommonJS) consumers, require the built package
(`dist/index.cjs`) or use a bundler that resolves the package `main`/`module`.

## API (high level)

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

Types and low-level SB3 shapes are exported from the package (see `src/base.ts`)
and include `Sb3Block`, `Sb3Workspace`, `Sb3Input`, `Sb3Field` and related
structures.

## Files overview

- `src/index.ts` — package exports (re-exports `base`, `serializer`, and `uid`).
- `src/serializer.ts` — core serialization logic and helpers.
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

