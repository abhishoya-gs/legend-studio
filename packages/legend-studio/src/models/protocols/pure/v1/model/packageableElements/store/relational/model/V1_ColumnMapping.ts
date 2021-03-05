/**
 * Copyright 2020 Goldman Sachs
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

import { hashArray } from '@finos/legend-studio-shared';
import { CORE_HASH_STRUCTURE } from '../../../../../../../../MetaModelConst';
import type { Hashable } from '@finos/legend-studio-shared';
import type { V1_RelationalOperationElement } from '../../../../../model/packageableElements/store/relational/model/V1_RelationalOperationElement';

export class V1_ColumnMapping implements Hashable {
  name!: string;
  operation!: V1_RelationalOperationElement;

  get hashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.COLUMN_MAPPING,
      this.name,
      this.operation,
    ]);
  }
}