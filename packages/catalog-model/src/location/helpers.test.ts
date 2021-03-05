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

import { parseLocationReference, stringifyLocationReference } from './helpers';

describe('parseLocationReference', () => {
  it('works for the simple case', () => {
    expect(parseLocationReference('url:https://www.google.com')).toEqual({
      type: 'url',
      target: 'https://www.google.com',
    });
    expect(parseLocationReference('custom')).toEqual({
      type: 'custom',
      target: '',
    });
    expect(parseLocationReference('custom:')).toEqual({
      type: 'custom',
      target: '',
    });
  });

  it('rejects faulty inputs', () => {
    expect(() => parseLocationReference(7 as any)).toThrow(
      "Unable to parse location reference '7', unexpected argument number",
    );
    expect(() => parseLocationReference(':hello')).toThrow(
      "Unable to parse location reference ':hello', empty type",
    );
    expect(() => parseLocationReference('http://host')).toThrow(
      "Invalid location reference 'http://host', please prefix it with 'url:'",
    );
    expect(() => parseLocationReference('https://host')).toThrow(
      "Invalid location reference 'https://host', please prefix it with 'url:'",
    );
  });
});

describe('stringifyLocationReference', () => {
  it('works for the simple case', () => {
    expect(
      stringifyLocationReference({
        type: 'url',
        target: 'https://www.google.com',
      }),
    ).toEqual('url:https://www.google.com');
    expect(stringifyLocationReference({ type: 'custom', target: '' })).toEqual(
      'custom:',
    );
  });

  it('rejects faulty inputs', () => {
    expect(() =>
      stringifyLocationReference({ type: '', target: 'hello' }),
    ).toThrow('Unable to stringify location reference, empty type');
  });
});
