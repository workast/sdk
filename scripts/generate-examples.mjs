/**
 * Compose Public success examples for generate-types.mjs.
 * Arrays unwrap to the item schema (Tag[] → Tag).
 */
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options', 'trace'];
const SUCCESS_STATUSES = ['200', '201'];

export function resolveRef(ref, spec) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) {
    return undefined;
  }
  return ref
    .slice(2)
    .split('/')
    .reduce((node, key) => (node == null ? undefined : node[key]), spec);
}

function schemaName(ref) {
  const prefix = '#/components/schemas/';
  return typeof ref === 'string' && ref.startsWith(prefix) ? ref.slice(prefix.length) : undefined;
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function camelCaseType(name) {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function composeExample(schema, spec, seen = new Set()) {
  if (schema == null || typeof schema !== 'object') {
    return { ok: false, reason: 'missing schema' };
  }

  if (schema.example !== undefined) {
    return { ok: true, value: schema.example };
  }

  if (schema.$ref) {
    if (seen.has(schema.$ref)) {
      return { ok: false, reason: `cycle ${schema.$ref}` };
    }
    const resolved = resolveRef(schema.$ref, spec);
    if (!resolved) {
      return { ok: false, reason: `unresolved $ref ${schema.$ref}` };
    }
    seen.add(schema.$ref);
    return composeExample(resolved, spec, seen);
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const merged = {};
    let mergedAny = false;
    for (const part of schema.allOf) {
      const composed = composeExample(part, spec, seen);
      if (!composed.ok) {
        continue;
      }
      if (!isPlainObject(composed.value)) {
        return composed;
      }
      Object.assign(merged, composed.value);
      mergedAny = true;
    }
    if (!mergedAny) {
      return { ok: false, reason: 'allOf parts have no example' };
    }
    return { ok: true, value: merged };
  }

  if (schema.type === 'array' || schema.items) {
    const item = composeExample(schema.items, spec, seen);
    if (!item.ok) {
      return { ok: false, reason: `array item: ${item.reason}` };
    }
    return { ok: true, value: [item.value] };
  }

  if (schema.properties && typeof schema.properties === 'object') {
    const value = {};
    let hasKey = false;
    for (const [key, property] of Object.entries(schema.properties)) {
      const composed = composeExample(property, spec, seen);
      if (composed.ok) {
        value[key] = composed.value;
        hasKey = true;
      }
    }
    if (hasKey) {
      return { ok: true, value };
    }
  }

  return { ok: false, reason: 'no example' };
}

export function successType(schema) {
  if (!schema || typeof schema !== 'object') {
    return { skip: true, reason: 'missing schema' };
  }
  if (schema.$ref) {
    const type = schemaName(schema.$ref);
    if (!type) {
      return { skip: true, reason: `unnamed $ref ${schema.$ref}` };
    }
    return { type };
  }
  if (schema.type === 'array' || schema.items) {
    if (schema.items?.$ref) {
      return successType(schema.items);
    }
    return { skip: true, reason: 'array of non-schema' };
  }
  return { skip: true, reason: 'inline schema' };
}

export function collectTypeExamples(spec) {
  const examples = {};
  const gaps = [];
  const skipped = [];
  const conflicts = [];

  for (const [specPath, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') {
        continue;
      }
      const operationId = operation.operationId ?? null;
      const status = SUCCESS_STATUSES.find((code) => operation.responses?.[code]);
      if (!status) {
        skipped.push({
          method: method.toUpperCase(),
          path: specPath,
          operationId,
          reason: 'no JSON success status',
        });
        continue;
      }
      const media = operation.responses[status]?.content?.['application/json'];
      if (!media) {
        skipped.push({
          method: method.toUpperCase(),
          path: specPath,
          operationId,
          status,
          reason: 'no application/json',
        });
        continue;
      }

      const typed = successType(media.schema);
      if (typed.skip) {
        skipped.push({
          method: method.toUpperCase(),
          path: specPath,
          operationId,
          status,
          reason: typed.reason,
        });
        continue;
      }

      const composed = composeExample({ $ref: `#/components/schemas/${typed.type}` }, spec);
      if (!composed.ok) {
        gaps.push({
          type: typed.type,
          operationId,
          method: method.toUpperCase(),
          path: specPath,
          reason: composed.reason,
        });
        continue;
      }

      const existing = examples[typed.type];
      const hash = JSON.stringify(composed.value);
      if (existing) {
        if (JSON.stringify(existing.example) !== hash) {
          conflicts.push({
            type: typed.type,
            operationIds: [...existing.usedBy, operationId].filter(Boolean),
          });
        }
        if (operationId && !existing.usedBy.includes(operationId)) {
          existing.usedBy.push(operationId);
        }
        continue;
      }

      examples[typed.type] = {
        type: typed.type,
        exportName: camelCaseType(typed.type),
        usedBy: operationId ? [operationId] : [],
        example: composed.value,
      };
    }
  }

  for (const entry of Object.values(examples)) {
    entry.usedBy.sort();
  }

  const ordered = {};
  for (const type of Object.keys(examples).sort()) {
    ordered[type] = examples[type];
  }

  return { examples: ordered, gaps, skipped, conflicts };
}

export function emitExamplesSource(examples, hash) {
  const types = Object.keys(examples);
  const imports = types.map((type) => `  ${type},`).join('\n');
  const consts = types
    .map((type) => {
      const entry = examples[type];
      return `export const ${entry.exportName}: ${type} = ${JSON.stringify(entry.example, null, 2)};`;
    })
    .join('\n\n');
  return `/**
 * This file was generated by scripts/generate-types.mjs. Do not edit.
 * Source swagger SHA-256: ${hash}
 */

import type {
${imports}
} from './generated.js';

${consts}
`;
}
