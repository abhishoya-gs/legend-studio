/**
 * Copyright (c) 2020-present, Goldman Sachs
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

import { type Hashable, hashArray } from '@finos/legend-shared';
import { SERVICE_STORE_HASH_STRUCTURE } from '../../../../../ESService_ModelUtils';
import { StringValuePattern } from './ESService_StringValuePattern';

export class EqualToPattern extends StringValuePattern implements Hashable {
  override get hashCode(): string {
    return hashArray([
      SERVICE_STORE_HASH_STRUCTURE.EQUAL_TO_PATTERN,
      this.expectedValue,
    ]);
  }
}
