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

export enum GRAPH_MANAGER_LOG_EVENT {
  GRAPH_BUILDER_ELEMENTS_DESERIALIZED = 'GRAPH_BUILDER_ELEMENTS_DESERIALIZED',
  GRAPH_BUILDER_ELEMENTS_INDEXED = 'GRAPH_BUILDER_ELEMENTS_INDEXED',
  GRAPH_BUILDER_SECTION_INDICES_BUILT = 'GRAPH_BUILDER_SECTION_INDICES_BUILT',
  GRAPH_BUILDER_DOMAIN_MODELS_BUILT = 'GRAPH_BUILDER_DOMAIN_MODELS_BUILT',
  GRAPH_BUILDER_STORES_BUILT = 'GRAPH_BUILDER_STORES_BUILT',
  GRAPH_BUILDER_MAPPINGS_BUILT = 'GRAPH_BUILDER_MAPPINGS_BUILT',
  GRAPH_BUILDER_CONNECTIONS_AND_RUNTIMES_BUILT = 'GRAPH_BUILDER_CONNECTIONS_AND_RUNTIMES_BUILT',
  GRAPH_BUILDER_SERVICES_BUILT = 'GRAPH_BUILDER_SERVICES_BUILT',
  GRAPH_BUILDER_OTHER_ELEMENTS_BUILT = 'GRAPH_BUILDER_OTHER_ELEMENTS_BUILT',
  GRAPH_BUILDER_POST_PROCESSED = 'GRAPH_BUILDER_POST_PROCESSED',
  GRAPH_BUILDER_COMPLETED = 'GRAPH_BUILDER_COMPLETED',

  GRAPH_INITIALIZED = 'GRAPH_INITIALIZED',
  GRAPH_DEPENDENCIES_FETCHED = 'GRAPH_DEPENDENCIES_FETCHED',
  GRAPH_ENTITIES_FETCHED = 'GRAPH_ENTITIES_FETCHED',
  GRAPH_UPDATED_AND_REBUILT = 'GRAPH_REBUILT',
  GRAPH_MODEL_TO_GRAMMAR_TRANSFORMED = 'GRAPH_MODEL_TO_GRAMMAR_TRANSFORMED',
  GRAPH_GRAMMAR_TO_MODEL_TRANSFORMED = 'GRAPH_GRAMMAR_TO_MODEL_TRANSFORMED',
  GRAPH_META_MODEL_TO_PROTOCOL_TRANSFORMED = 'GRAPH_META_MODEL_TO_PROTOCOL_TRANSFORMED',
  GRAPH_COMPILE_CONTEXT_COLLECTED = 'GRAPH_COMPILE_CONTEXT_COLLECTED',
  GRAPH_PROTOCOL_SERIALIZED = 'GRAPH_PROTOCOL_SERIALIZED',
  GRAPH_HASHES_PRECOMPUTED = 'GRAPH_HASHES_PRECOMPUTED',

  GRAPH_BUILDER_FAILURE = 'GRAPH_BUILD_FAILURE',
  EXECUTION_FAILURE = 'EXECUTION_FAILURE',
  COMPILATION_FAILURE = 'COMPILATION_FAILURE',
  PARSING_FAILURE = 'PARSING_FAILURE',
  GRAPH_MANAGER_FAILURE = 'GRAPH_MANAGER_FAILURE',
}
