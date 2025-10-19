import { Block, Script, CompiledFunction, CompiledFunctionWithDefault } from '@scratch-fuse/compiler';

interface Sb3Block {
    opcode: string;
    next: string | null;
    parent: string | null;
    inputs: {
        [key: string]: Sb3Input;
    };
    fields: {
        [key: string]: Sb3Field;
    };
    shadow: boolean;
    topLevel: boolean;
    x?: number;
    y?: number;
    mutation?: Sb3Mutation;
}
interface Sb3Mutation {
    [key: string]: string | Sb3Mutation[];
}
type Sb3ShadowInput = [4, string] | [10, string];
type Sb3VariableInput = [12, string, string];
type Sb3Input = [3, string, Sb3ShadowInput] | [3, Sb3VariableInput, Sb3ShadowInput] | [3, Sb3ShadowInput] | [1, Sb3ShadowInput] | [2, string] | [1, Sb3VariableInput] | [1, string] | [1, Sb3VariableInput];
type Sb3Field = [string, string | null];
type Sb3Workspace = Record<string, Sb3Block>;
interface Sb3Target {
    isStage: boolean;
    name: string;
    variables: Record<string, [
        string,
        string | number | boolean | (string | number | boolean)[]
    ]>;
    lists: Record<string, [string, (string | number | boolean)[]]>;
    broadcasts: Record<string, string>;
    blocks: Sb3Workspace;
    comments: Record<string, unknown>;
    currentCostume: number;
    costumes: Array<{
        assetId: string;
        name: string;
        md5ext: string;
        dataFormat: string;
        rotationCenterX: number;
        rotationCenterY: number;
    }>;
    sounds: Array<{
        assetId: string;
        name: string;
        md5ext: string;
        dataFormat: string;
        format: string;
        rate: number;
        sampleCount: number;
    }>;
    volume: number;
    layerOrder: number;
    tempo: number;
    videoTransparency: number;
    videoState: 'on' | 'off' | 'on-flipped';
    textToSpeechLanguage: string | null;
}

declare function serializeBlocks(blocks: Block[]): Sb3Workspace;
declare function serializeScript(script: Script): Sb3Workspace;
declare function serializeFunction(func: CompiledFunction): Sb3Workspace;
/**
 * 合并多个 Sb3Workspace
 */
declare function mergeWorkspaces(...workspaces: Sb3Workspace[]): Sb3Workspace;
/**
 * 验证序列化后的 workspace 的完整性
 */
declare function validateWorkspace(workspace: Sb3Workspace): void;

/**
 * 从 Sb3Workspace 反序列化为 Block 数组
 */
declare function deserializeBlocks(workspace: Sb3Workspace): Block[];
/**
 * 从 Sb3Workspace 反序列化为 Script
 */
declare function deserializeScript(workspace: Sb3Workspace): Script;
/**
 * 从 Sb3Workspace 反序列化为 CompiledFunction
 */
declare function deserializeFunction(workspace: Sb3Workspace): CompiledFunctionWithDefault;
/**
 * 从 Sb3Workspace 反序列化所有顶层脚本
 */
declare function deserializeAllScripts(workspace: Sb3Workspace): Script[];
/**
 * 从 Sb3Workspace 反序列化所有函数
 */
declare function deserializeAllFunctions(workspace: Sb3Workspace): CompiledFunctionWithDefault[];

/**
 * @fileoverview UID generator, from Blockly.
 */
/**
 * Generate a unique ID, from Blockly.  This should be globally unique.
 * 87 characters ^ 20 length > 128 bits (better than a UUID).
 * @return {string} A globally unique ID string.
 */
declare function uid(): string;

export { type Sb3Block, type Sb3Field, type Sb3Input, type Sb3Mutation, type Sb3ShadowInput, type Sb3Target, type Sb3VariableInput, type Sb3Workspace, deserializeAllFunctions, deserializeAllScripts, deserializeBlocks, deserializeFunction, deserializeScript, mergeWorkspaces, serializeBlocks, serializeFunction, serializeScript, uid, validateWorkspace };
