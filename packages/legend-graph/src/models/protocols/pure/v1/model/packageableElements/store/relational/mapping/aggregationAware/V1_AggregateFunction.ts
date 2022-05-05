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

import type { V1_RawLambda } from '../../../../../../model/rawValueSpecification/V1_RawLambda';
import { type Hashable, hashArray } from '@finos/legend-shared';
import { CORE_HASH_STRUCTURE } from '../../../../../../../../../../MetaModelConst';
import { hashLambda } from '../../../../../../../../../../MetaModelUtils';

export class V1_AggregateFunction implements Hashable {
  /**
   * Studio does not process value specification, they are left in raw JSON form
   *
   * @discrepancy model
   */
  mapFn!: V1_RawLambda;
  /**
   * Studio does not process value specification, they are left in raw JSON form
   *
   * @discrepancy model
   */
  aggregateFn!: V1_RawLambda;

  get hashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.AGGREGATE_FUNCTION,
      hashLambda(this.mapFn.parameters, this.mapFn.body),
      hashLambda(this.aggregateFn.parameters, this.aggregateFn.body),
    ]);
  }
}
