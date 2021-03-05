/*
 * Copyright 2021 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LocationSpec } from './types';

/**
 * Parses a string form location reference.
 *
 * @param ref A string-form location reference, e.g. 'url:https://host'
 * @returns A location reference, e.g. { type: 'url', target: 'https://host' }
 */
export function parseLocationReference(ref: string): LocationSpec {
  if (typeof ref !== 'string') {
    throw new TypeError(
      `Unable to parse location reference '${ref}', unexpected argument ${typeof ref}`,
    );
  }

  const splitIndex = ref.indexOf(':');
  if (splitIndex === 0) {
    throw new TypeError(
      `Unable to parse location reference '${ref}', empty type`,
    );
  } else if (splitIndex === -1) {
    return { type: ref, target: '' };
  }

  const type = ref.substr(0, splitIndex);
  const target = ref.substr(splitIndex + 1);

  if (type === 'http' || type === 'https') {
    throw new TypeError(
      `Invalid location reference '${ref}', please prefix it with 'url:'`,
    );
  }

  return { type, target };
}

/**
 * Turns a location reference into its string form.
 *
 * @param ref A location reference, e.g. { type: 'url', target: 'https://host' }
 * @returns A string-form location reference, e.g. 'url:https://host'
 */
export function stringifyLocationReference(ref: {
  type: string;
  target: string;
}): string {
  const { type, target } = ref;

  if (!type) {
    throw new TypeError(`Unable to stringify location reference, empty type`);
  }

  return `${type}:${target}`;
}
