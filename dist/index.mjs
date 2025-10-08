// src/uid.ts
var soup_ = "!#%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function uid() {
  const length = 20;
  const soupLength = soup_.length;
  const id = [];
  for (let i = 0; i < length; i++) {
    id[i] = soup_.charAt(Math.random() * soupLength);
  }
  return id.join("");
}

// src/serializer.ts
function createContext() {
  return {
    workspace: {},
    reporterCache: /* @__PURE__ */ new Map()
  };
}
function serializeReporter(reporter, context, parentId) {
  const id = uid();
  const sb3Block = {
    opcode: reporter.opcode,
    next: null,
    parent: parentId || null,
    inputs: {},
    fields: {},
    shadow: false,
    topLevel: false
  };
  for (const [key, value] of Object.entries(reporter.inputs)) {
    const result = serializeInput(value, context, id);
    if (result) {
      sb3Block.inputs[key] = result;
    }
  }
  for (const [key, value] of Object.entries(reporter.fields)) {
    sb3Block.fields[key] = [value, null];
  }
  if (reporter.mutation) {
    sb3Block.mutation = reporter.mutation;
  }
  context.workspace[id] = sb3Block;
  return [id, sb3Block];
}
function serializeInput(input, context, parentId) {
  if (input.type === "any") {
    if (typeof input.value === "string") {
      return [1, [10, input.value]];
    } else {
      const [reporterId] = serializeReporter(input.value, context, parentId);
      return [3, reporterId, [10, ""]];
    }
  } else if (input.type === "bool") {
    const [reporterId] = serializeReporter(input.value, context, parentId);
    return [2, reporterId];
  } else if (input.type === "substack") {
    if (input.value.length === 0) {
      return null;
    }
    const substackIds = [];
    for (const block of input.value) {
      const id = uid();
      const sb3Block = serializeBlock(block, context, id);
      context.workspace[id] = sb3Block;
      substackIds.push(id);
    }
    for (let i = 0; i < substackIds.length; i++) {
      const currentId = substackIds[i];
      const nextId = i < substackIds.length - 1 ? substackIds[i + 1] : null;
      const parentId2 = i > 0 ? substackIds[i - 1] : null;
      context.workspace[currentId].next = nextId;
      context.workspace[currentId].parent = parentId2;
    }
    return [2, substackIds[0]];
  }
  throw new Error(`Unsupported input type: ${JSON.stringify(input)}`);
}
function serializeBlock(block, context, blockId) {
  const sb3Block = {
    opcode: block.opcode,
    next: null,
    parent: null,
    inputs: {},
    fields: {},
    shadow: false,
    topLevel: false
  };
  for (const [key, value] of Object.entries(block.inputs)) {
    const result = serializeInput(value, context, blockId);
    if (result) {
      sb3Block.inputs[key] = result;
    }
  }
  for (const [key, value] of Object.entries(block.fields)) {
    sb3Block.fields[key] = [value, ""];
  }
  if (block.mutation) {
    sb3Block.mutation = block.mutation;
  }
  return sb3Block;
}
function serializeBlocks(blocks) {
  if (blocks.length === 0) {
    return {};
  }
  const context = createContext();
  const blockIds = [];
  for (const block of blocks) {
    const id = uid();
    const sb3Block = serializeBlock(block, context, id);
    context.workspace[id] = sb3Block;
    blockIds.push(id);
  }
  for (let i = 0; i < blockIds.length; i++) {
    const currentId = blockIds[i];
    const nextId = i < blockIds.length - 1 ? blockIds[i + 1] : null;
    const parentId = i > 0 ? blockIds[i - 1] : null;
    context.workspace[currentId].next = nextId;
    context.workspace[currentId].parent = parentId;
  }
  return context.workspace;
}
function serializeScript(script) {
  const context = createContext();
  let topLevelId = null;
  if (script.hat) {
    const hatId = uid();
    const hatBlock = {
      opcode: script.hat.opcode,
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: false,
      topLevel: true,
      x: 0,
      y: 0
    };
    for (const [key, value] of Object.entries(script.hat.inputs)) {
      const result = serializeInput(value, context, hatId);
      if (result) {
        hatBlock.inputs[key] = result;
      }
    }
    for (const [key, value] of Object.entries(script.hat.fields)) {
      hatBlock.fields[key] = [value, ""];
    }
    if (script.hat.mutation) {
      hatBlock.mutation = script.hat.mutation;
    }
    context.workspace[hatId] = hatBlock;
    topLevelId = hatId;
  }
  if (script.blocks.length > 0) {
    const blockIds = [];
    for (const block of script.blocks) {
      const id = uid();
      const sb3Block = serializeBlock(block, context, id);
      context.workspace[id] = sb3Block;
      blockIds.push(id);
    }
    for (let i = 0; i < blockIds.length; i++) {
      const currentId = blockIds[i];
      const nextId = i < blockIds.length - 1 ? blockIds[i + 1] : null;
      const parentId = i > 0 ? blockIds[i - 1] : null;
      context.workspace[currentId].next = nextId;
      context.workspace[currentId].parent = parentId;
    }
    const firstBlockId = blockIds[0];
    if (topLevelId) {
      context.workspace[topLevelId].next = firstBlockId;
      context.workspace[firstBlockId].parent = topLevelId;
    } else {
      context.workspace[firstBlockId].topLevel = true;
      context.workspace[firstBlockId].x = 0;
      context.workspace[firstBlockId].y = 0;
    }
  } else if (topLevelId) {
    context.workspace[topLevelId].topLevel = true;
  }
  return context.workspace;
}
function serializeFunction(func) {
  const context = createContext();
  const definitionId = uid();
  const prototypeId = uid();
  const argumentNames = func.decl.parameters.map((p) => p.name.name);
  const argumentReporterIds = Object.fromEntries(
    func.decl.parameters.map((p) => {
      return [p.name.name, uid()];
    })
  );
  const prototypeBlock = {
    opcode: "procedures_prototype",
    next: null,
    parent: definitionId,
    inputs: {},
    fields: {},
    shadow: true,
    topLevel: false,
    mutation: {
      tagName: "mutation",
      children: [],
      proccode: func.proccode,
      argumentids: JSON.stringify(argumentNames),
      // dummy since we don't know the IDs when calling function
      argumentnames: JSON.stringify(argumentNames),
      argumentdefaults: JSON.stringify(
        func.decl.parameters.map(
          (p) => p.type.name === "any" ? "" : "false"
        )
      ),
      warp: func.decl.once ? "true" : "false"
    }
  };
  const definitionBlock = {
    opcode: "procedures_definition",
    next: null,
    parent: null,
    inputs: {
      custom_block: [1, prototypeId]
    },
    fields: {},
    shadow: false,
    topLevel: true,
    x: 0,
    y: 0
  };
  context.workspace[definitionId] = definitionBlock;
  context.workspace[prototypeId] = prototypeBlock;
  for (const [name, id] of Object.entries(argumentReporterIds)) {
    const param = func.decl.parameters.find(
      (p) => p.name.name === name
    );
    if (!param) continue;
    const reporterBlock = {
      opcode: param.type.name === "bool" ? "argument_reporter_boolean" : "argument_reporter_string_number",
      next: null,
      parent: prototypeId,
      inputs: {},
      fields: {
        VALUE: [name, null]
      },
      shadow: true,
      topLevel: false
    };
    context.workspace[id] = reporterBlock;
    if (param.type.name === "bool") {
      prototypeBlock.inputs[name] = [2, id];
    } else {
      prototypeBlock.inputs[name] = [1, id];
    }
  }
  if (func.impl && func.impl.length > 0) {
    const implIds = [];
    for (const block of func.impl) {
      const id = uid();
      const sb3Block = serializeBlock(block, context, id);
      context.workspace[id] = sb3Block;
      implIds.push(id);
    }
    for (let i = 0; i < implIds.length; i++) {
      const currentId = implIds[i];
      const nextId = i < implIds.length - 1 ? implIds[i + 1] : null;
      const parentId = i > 0 ? implIds[i - 1] : null;
      context.workspace[currentId].next = nextId;
      context.workspace[currentId].parent = parentId;
    }
    if (implIds.length > 0) {
      const firstImplId = implIds[0];
      context.workspace[definitionId].next = firstImplId;
      context.workspace[firstImplId].parent = definitionId;
    }
  }
  return context.workspace;
}
function mergeWorkspaces(...workspaces) {
  return Object.assign({}, ...workspaces);
}
function validateWorkspace(workspace) {
  for (const [id, block] of Object.entries(workspace)) {
    if (block.next && !workspace[block.next]) {
      throw new Error(
        `Block ${id} references non-existent next block: ${block.next}`
      );
    }
    if (block.parent && !workspace[block.parent]) {
      throw new Error(
        `Block ${id} references non-existent parent block: ${block.parent}`
      );
    }
    for (const [inputKey, input] of Object.entries(block.inputs)) {
      if (Array.isArray(input) && input.length >= 2 && typeof input[1] === "string") {
        const referencedId = input[1];
        if (!workspace[referencedId]) {
          throw new Error(
            `Block ${id} input ${inputKey} references non-existent block: ${referencedId}`
          );
        }
      }
    }
  }
}

// src/deserializer.ts
import { parseProccodeArgumentTypes } from "@scratch-fuse/utility";
function createContext2(workspace) {
  return {
    workspace,
    processedBlocks: /* @__PURE__ */ new Set()
  };
}
function deserializeInput(key, input, context) {
  if (Array.isArray(input)) {
    const [type, ...rest] = input;
    if (type === 1) {
      const value = rest[0];
      if (!value) return null;
      if (typeof value === "string") {
        const reporter = deserializeReporter(value, context);
        return { type: "any", value: reporter };
      } else if (rest[0][0] === 12) {
        return {
          type: "any",
          value: {
            opcode: "data_variable",
            fields: {
              VARIABLE: rest[0][1]
            },
            inputs: {}
          }
        };
      } else {
        return { type: "any", value: rest[0][1] };
      }
    } else if (type === 2) {
      const blockId = rest[0];
      if (!blockId) return null;
      if (typeof blockId !== "string") {
        if (blockId[0] === 12) {
          return {
            type: "any",
            value: {
              opcode: "data_variable",
              fields: {
                VARIABLE: blockId[1]
              },
              inputs: {}
            }
          };
        } else {
          return { type: "any", value: blockId[1] };
        }
      }
      const block = context.workspace[blockId];
      if (!block) {
        throw new Error(`Block not found: ${blockId}`);
      }
      const isSubstack = block.next !== null || key.startsWith("SUBSTACK");
      if (isSubstack) {
        const blocks = deserializeBlockChain(blockId, context);
        return { type: "substack", value: blocks };
      } else {
        const reporter = deserializeReporter(blockId, context);
        return { type: "bool", value: reporter };
      }
    } else if (type === 3) {
      const block = rest[0];
      if (!block) return null;
      if (typeof block === "string") {
        const reporter = deserializeReporter(block, context);
        return { type: "any", value: reporter };
      } else if (block[0] === 12) {
        return {
          type: "any",
          value: {
            opcode: "data_variable",
            fields: {
              VARIABLE: block[1]
            },
            inputs: {}
          }
        };
      } else {
        return { type: "any", value: block[1] };
      }
    }
  }
  throw new Error(`Unsupported input format: ${JSON.stringify(input)}`);
}
function deserializeReporter(blockId, context) {
  const sb3Block = context.workspace[blockId];
  if (!sb3Block) {
    throw new Error(`Block not found: ${blockId}`);
  }
  const reporter = {
    opcode: sb3Block.opcode,
    inputs: {},
    fields: {}
  };
  for (const [key, value] of Object.entries(sb3Block.inputs)) {
    const result = deserializeInput(key, value, context);
    if (result) reporter.inputs[key] = result;
  }
  for (const [key, value] of Object.entries(sb3Block.fields)) {
    reporter.fields[key] = value[0];
  }
  if (sb3Block.mutation) {
    reporter.mutation = sb3Block.mutation;
  }
  return reporter;
}
function deserializeBlock(blockId, context) {
  const sb3Block = context.workspace[blockId];
  if (!sb3Block) {
    throw new Error(`Block not found: ${blockId}`);
  }
  context.processedBlocks.add(blockId);
  const block = {
    opcode: sb3Block.opcode,
    inputs: {},
    fields: {}
  };
  for (const [key, value] of Object.entries(sb3Block.inputs)) {
    const result = deserializeInput(key, value, context);
    if (result) block.inputs[key] = result;
  }
  for (const [key, value] of Object.entries(sb3Block.fields)) {
    block.fields[key] = value[0];
  }
  if (sb3Block.mutation) {
    block.mutation = sb3Block.mutation;
  }
  return block;
}
function deserializeBlockChain(startBlockId, context) {
  const blocks = [];
  let currentId = startBlockId;
  while (currentId !== null) {
    if (context.processedBlocks.has(currentId)) {
      break;
    }
    const sb3Block = context.workspace[currentId];
    if (!sb3Block) {
      throw new Error(`Block not found: ${currentId}`);
    }
    const block = deserializeBlock(currentId, context);
    blocks.push(block);
    currentId = sb3Block.next;
  }
  return blocks;
}
function deserializeHat(blockId, context) {
  const sb3Block = context.workspace[blockId];
  if (!sb3Block) {
    throw new Error(`Block not found: ${blockId}`);
  }
  context.processedBlocks.add(blockId);
  const hat = {
    opcode: sb3Block.opcode,
    inputs: {},
    fields: {}
  };
  for (const [key, value] of Object.entries(sb3Block.inputs)) {
    const result = deserializeInput(key, value, context);
    if (result) hat.inputs[key] = result;
  }
  for (const [key, value] of Object.entries(sb3Block.fields)) {
    hat.fields[key] = value[0];
  }
  if (sb3Block.mutation) {
    hat.mutation = sb3Block.mutation;
  }
  return hat;
}
function deserializeBlocks(workspace) {
  const context = createContext2(workspace);
  const topLevelBlocks = Object.entries(workspace).filter(([_, block]) => block.topLevel && block.parent === null).map(([id]) => id);
  if (topLevelBlocks.length === 0) {
    return [];
  }
  const firstTopLevelId = topLevelBlocks[0];
  return deserializeBlockChain(firstTopLevelId, context);
}
function deserializeScript(workspace) {
  const context = createContext2(workspace);
  const topLevelEntries = Object.entries(workspace).filter(
    ([_, block]) => block.topLevel && block.parent === null
  );
  if (topLevelEntries.length === 0) {
    return { blocks: [] };
  }
  const [topLevelId, topLevelBlock] = topLevelEntries[0];
  const isHatBlock = topLevelBlock.opcode.startsWith("event_");
  if (isHatBlock) {
    const hat = deserializeHat(topLevelId, context);
    const nextId = topLevelBlock.next;
    if (nextId) {
      const blocks = deserializeBlockChain(nextId, context);
      return { hat, blocks };
    } else {
      return { hat, blocks: [] };
    }
  } else {
    const blocks = deserializeBlockChain(topLevelId, context);
    return { blocks };
  }
}
function deserializeFunction(workspace) {
  const context = createContext2(workspace);
  const definitionEntry = Object.entries(workspace).find(
    ([_, block]) => block.opcode === "procedures_definition"
  );
  if (!definitionEntry) {
    throw new Error("No procedures_definition block found");
  }
  const [definitionId, definitionBlock] = definitionEntry;
  const customBlockInput = definitionBlock.inputs.custom_block;
  if (!customBlockInput || !Array.isArray(customBlockInput)) {
    throw new Error("Invalid custom_block input");
  }
  const prototypeId = customBlockInput[0] === 1 ? customBlockInput[1] : customBlockInput[1];
  const prototypeBlock = context.workspace[prototypeId];
  if (!prototypeBlock || prototypeBlock.opcode !== "procedures_prototype") {
    throw new Error("Invalid procedures_prototype block");
  }
  const mutation = prototypeBlock.mutation;
  if (!mutation) {
    throw new Error("No mutation found in procedures_prototype");
  }
  const proccode = mutation.proccode;
  const argumentnames = JSON.parse(mutation.argumentnames);
  const argumentdefaults = JSON.parse(
    mutation.argumentdefaults
  );
  const argumentTypes = parseProccodeArgumentTypes(proccode);
  const warp = mutation.warp === "true";
  const parameters = argumentnames.map((name, index) => {
    const type = argumentTypes[index] || "any";
    return {
      name: { name },
      type: { name: type }
    };
  });
  const decl = {
    name: { name: "" },
    parameters,
    once: warp,
    returnType: { name: "" }
  };
  const nextId = definitionBlock.next;
  const impl = nextId ? deserializeBlockChain(nextId, context) : [];
  return {
    decl,
    proccode,
    impl,
    defaultValues: argumentdefaults
  };
}
function deserializeAllScripts(workspace) {
  const context = createContext2(workspace);
  const topLevelIds = Object.entries(workspace).filter(([_, block]) => block.topLevel && block.parent === null).map(([id]) => id);
  const scripts = [];
  for (const topLevelId of topLevelIds) {
    if (context.processedBlocks.has(topLevelId)) {
      continue;
    }
    const topLevelBlock = workspace[topLevelId];
    if (topLevelBlock.opcode === "procedures_definition") {
      continue;
    }
    const hat = deserializeHat(topLevelId, context);
    const nextId = topLevelBlock.next;
    const blocks = nextId ? deserializeBlockChain(nextId, context) : [];
    scripts.push({ hat, blocks });
  }
  return scripts;
}
function deserializeAllFunctions(workspace) {
  const functions = [];
  const definitionIds = Object.entries(workspace).filter(([_, block]) => block.opcode === "procedures_definition").map(([id]) => id);
  for (const definitionId of definitionIds) {
    const functionWorkspace = {};
    const collectFunctionBlocks = (blockId) => {
      if (functionWorkspace[blockId]) {
        return;
      }
      const block = workspace[blockId];
      if (!block) {
        return;
      }
      functionWorkspace[blockId] = block;
      if (block.next) {
        collectFunctionBlocks(block.next);
      }
      for (const input of Object.values(block.inputs)) {
        if (Array.isArray(input)) {
          if (typeof input[1] === "string") {
            collectFunctionBlocks(input[1]);
          }
        }
      }
    };
    collectFunctionBlocks(definitionId);
    const func = deserializeFunction(functionWorkspace);
    functions.push(func);
  }
  return functions;
}
export {
  deserializeAllFunctions,
  deserializeAllScripts,
  deserializeBlocks,
  deserializeFunction,
  deserializeScript,
  mergeWorkspaces,
  serializeBlocks,
  serializeFunction,
  serializeScript,
  uid,
  validateWorkspace
};
