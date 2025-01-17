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

import {
  type Mapping,
  type MappingTestSuite,
  type Class,
  type MappingModelCoverageAnalysisResult,
  type GraphManagerState,
  type RawLambda,
  type MappingTest,
  type SetImplementation,
  type TestAssertion,
  type AtomicTest,
  type EmbeddedData,
  type Store,
  type DataElement,
  LAMBDA_PIPE,
  buildSourceInformationSourceId,
  isStubbed_RawLambda,
  GRAPH_MANAGER_EVENT,
  MappingDataTestSuite,
  MappingQueryTestSuite,
  RootGraphFetchTree,
  PackageableElementExplicitReference,
  EntityMappedProperty,
  PropertyGraphFetchTree,
  PropertyExplicitReference,
  LambdaFunction,
  FunctionType,
  Multiplicity,
  CORE_PURE_PATH,
  buildRawLambdaFromLambdaFunction,
  MappingDataTest,
  MappingQueryTest,
  PureInstanceSetImplementation,
  StoreTestData,
  ModelStore,
  getRootSetImplementation,
  stub_RawLambda,
  DataElementReference,
  RelationalCSVData,
  getAllClassProperties,
  getAllClassDerivedProperties,
  RelationalInstanceSetImplementation,
  EmbeddedRelationalInstanceSetImplementation,
  Database,
} from '@finos/legend-graph';
import { action, flow, flowResult, makeObservable, observable } from 'mobx';
import {
  ActionState,
  assertErrorThrown,
  guaranteeNonNullable,
  type GeneratorFn,
  assertTrue,
  isNonNullable,
  UnsupportedOperationError,
  LogEvent,
  uuid,
} from '@finos/legend-shared';
import {
  LambdaEditorState,
  buildGetAllFunction,
  buildSerialzieFunctionWithGraphFetch,
} from '@finos/legend-query-builder';
import type { EditorStore } from '../../../../EditorStore.js';
import {
  resolveMappingSourceToStore,
  type MappingEditorState,
  getMappingElementSource,
} from '../MappingEditorState.js';
import {
  mappingTestable_addStoreTestData,
  mappingTestable_deleteStoreTestData,
  mappingTestable_setQuery,
  mapping_addTestSuite,
  mapping_deleteTestSuite,
} from '../../../../../graph-modifier/DSL_Mapping_GraphModifierHelper.js';
import {
  DEFAULT_TEST_ASSERTION_ID,
  createBareExternalFormat,
  createDefaultEqualToJSONTestAssertion,
  createEmbeddedDataFromClass,
} from '../../../../utils/TestableUtils.js';
import {
  TESTABLE_TEST_TAB,
  TestableTestEditorState,
} from '../../testable/TestableEditorState.js';
import { EmbeddedDataEditorState } from '../../data/DataEditorState.js';
import {
  testSuite_addTest,
  testSuite_deleteTest,
  testable_setId,
} from '../../../../../graph-modifier/Testable_GraphModifierHelper.js';
import { EmbeddedDataType } from '../../../ExternalFormatState.js';

export enum MAPPING_TEST_SUITE_TYPE {
  DATA = 'DATA',
  QUERY = 'QUERY',
}

const createGraphFetchLambda = (
  mainClass: Class,
  graphManagerState: GraphManagerState,
  root: RootGraphFetchTree,
): RawLambda => {
  const lambdaFunction = new LambdaFunction(
    new FunctionType(
      PackageableElementExplicitReference.create(
        graphManagerState.graph.getType(CORE_PURE_PATH.ANY),
      ),
      Multiplicity.ONE,
    ),
  );
  const getAllFunction = buildGetAllFunction(mainClass, Multiplicity.ONE);
  const serialize = buildSerialzieFunctionWithGraphFetch(
    root,
    false,
    getAllFunction,
    undefined,
  );
  lambdaFunction.expressionSequence = [serialize];
  return buildRawLambdaFromLambdaFunction(lambdaFunction, graphManagerState);
};

const createBareMappingDataTest = (
  id: string,
  storeTestData: StoreTestData | undefined,
): MappingDataTest => {
  const dataTest = new MappingDataTest();
  dataTest.id = id;
  dataTest.storeTestData = storeTestData ? [storeTestData] : [];
  dataTest.assertions = [
    createDefaultEqualToJSONTestAssertion(DEFAULT_TEST_ASSERTION_ID),
  ];
  return dataTest;
};

const createBareMappingQueryTest = (
  id: string,
  query: RawLambda,
): MappingQueryTest => {
  const dataTest = new MappingQueryTest();
  dataTest.id = id;
  dataTest.query = query;
  dataTest.assertions = [
    createDefaultEqualToJSONTestAssertion(DEFAULT_TEST_ASSERTION_ID),
  ];
  return dataTest;
};

export class MappingTestableQueryState extends LambdaEditorState {
  editorStore: EditorStore;
  parent: MappingQueryTestSuite | MappingQueryTest;
  isInitializingLambda = false;
  query: RawLambda;

  constructor(
    editorStore: EditorStore,
    parent: MappingQueryTestSuite | MappingQueryTest,
    query: RawLambda,
  ) {
    super('', LAMBDA_PIPE);

    makeObservable(this, {
      query: observable,
      isInitializingLambda: observable,
      setIsInitializingLambda: action,
      updateLamba: flow,
    });

    this.parent = parent;
    this.editorStore = editorStore;
    this.query = query;
  }

  get lambdaId(): string {
    return buildSourceInformationSourceId([this.uuid]);
  }

  setIsInitializingLambda(val: boolean): void {
    this.isInitializingLambda = val;
  }

  *updateLamba(val: RawLambda): GeneratorFn<void> {
    this.query = val;
    mappingTestable_setQuery(this.parent, val);
    yield flowResult(this.convertLambdaObjectToGrammarString(true));
  }

  *convertLambdaObjectToGrammarString(pretty?: boolean): GeneratorFn<void> {
    if (!isStubbed_RawLambda(this.query)) {
      try {
        const lambdas = new Map<string, RawLambda>();
        lambdas.set(this.lambdaId, this.query);
        const isolatedLambdas =
          (yield this.editorStore.graphManagerState.graphManager.lambdasToPureCode(
            lambdas,
            pretty,
          )) as Map<string, string>;
        const grammarText = isolatedLambdas.get(this.lambdaId);
        this.setLambdaString(
          grammarText !== undefined
            ? this.extractLambdaString(grammarText)
            : '',
        );
        this.clearErrors();
      } catch (error) {
        assertErrorThrown(error);
        this.editorStore.applicationStore.logService.error(
          LogEvent.create(GRAPH_MANAGER_EVENT.PARSING_FAILURE),
          error,
        );
      }
    } else {
      this.clearErrors();
      this.setLambdaString('');
    }
  }

  // NOTE: since we don't allow edition in text mode, we don't need to implement this
  *convertLambdaGrammarStringToObject(): GeneratorFn<void> {
    throw new UnsupportedOperationError();
  }
}

export abstract class MappingTestState extends TestableTestEditorState {
  readonly mappingTestableState: MappingTestableState;
  readonly uuid = uuid();
  override test: MappingTest;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
    test: MappingTest,
  ) {
    super(
      mappingTestableState.mapping,
      test,
      mappingTestableState.mappingEditorState.isReadOnly,
      editorStore,
    );
    this.mappingTestableState = mappingTestableState;
    this.test = test;
    this.selectedTab = this.defaultTab();
  }

  abstract defaultTab(): TESTABLE_TEST_TAB;
}

export class StoreTestDataState {
  readonly editorStore: EditorStore;
  readonly testDataState: MappingTestableDataState;
  storeTestData: StoreTestData;
  generatingTestDataSate = ActionState.create();
  embeddedEditorState: EmbeddedDataEditorState;

  constructor(
    editorStore: EditorStore,
    testDataState: MappingTestableDataState,
    value: StoreTestData,
  ) {
    makeObservable(this, {
      storeTestData: observable,
      generatingTestDataSate: observable,
    });
    this.editorStore = editorStore;
    this.testDataState = testDataState;
    this.storeTestData = value;
    this.embeddedEditorState = new EmbeddedDataEditorState(
      this.testDataState.editorStore,
      this.storeTestData.data,
    );
  }
}
export class MappingTestableDataState {
  readonly editorStore: EditorStore;
  readonly mappingTestableState: MappingTestableState;
  selectedDataState: StoreTestDataState | undefined;
  dataHolder: MappingDataTest | MappingDataTestSuite;
  showNewModal = false;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
    holder: MappingDataTest | MappingDataTestSuite,
  ) {
    makeObservable(this, {
      selectedDataState: observable,
      showNewModal: observable,
      openStoreTestData: action,
      initDefaultStore: action,
      deleteStoreTestData: action,
      setShowModal: action,
      addStoreTestData: action,
    });
    this.editorStore = editorStore;
    this.mappingTestableState = mappingTestableState;
    this.dataHolder = holder;
    this.initDefaultStore();
  }

  initDefaultStore(): void {
    const val = this.dataHolder.storeTestData[0];
    if (val) {
      this.openStoreTestData(val);
    } else {
      this.selectedDataState = undefined;
    }
  }

  setShowModal(val: boolean): void {
    this.showNewModal = val;
  }

  openStoreTestData(val: StoreTestData): void {
    this.selectedDataState = new StoreTestDataState(
      this.editorStore,
      this,
      val,
    );
  }

  deleteStoreTestData(val: StoreTestData): void {
    mappingTestable_deleteStoreTestData(this.dataHolder, val);
    this.initDefaultStore();
  }

  addStoreTestData(
    val: Store,
    type: string,
    dataElement: DataElement | undefined,
  ): void {
    const _storeData = new StoreTestData();
    _storeData.store = PackageableElementExplicitReference.create(val);
    let data: EmbeddedData = createBareExternalFormat(undefined, '{}');
    if (type === EmbeddedDataType.RELATIONAL_CSV) {
      data = new RelationalCSVData();
    } else if (type === EmbeddedDataType.DATA_ELEMENT && dataElement) {
      const refData = new DataElementReference();
      refData.dataElement =
        PackageableElementExplicitReference.create(dataElement);
      data = refData;
    }
    // TODO: run on extensions
    _storeData.data = data;
    mappingTestable_addStoreTestData(this.dataHolder, _storeData);
    this.openStoreTestData(_storeData);
  }
}

export class MappingQueryTestState extends MappingTestState {
  override test: MappingQueryTest;
  queryState: MappingTestableQueryState;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
    test: MappingQueryTest,
  ) {
    super(editorStore, mappingTestableState, test);
    makeObservable(this, {
      defaultTab: observable,
      selectedAsertionState: observable,
      selectedTab: observable,
      assertionToRename: observable,
      assertionEditorStates: observable,
      testResultState: observable,
      runningTestAction: observable,
      addAssertion: action,
      setAssertionToRename: action,
      handleTestResult: action,
      buildQueryState: action,
      setSelectedTab: action,
      runTest: flow,
      test: observable,
    });
    this.test = test;
    this.queryState = this.buildQueryState();
  }

  override defaultTab(): TESTABLE_TEST_TAB {
    return TESTABLE_TEST_TAB.SETUP;
  }

  buildQueryState(): MappingTestableQueryState {
    const queryState = new MappingTestableQueryState(
      this.editorStore,
      this.test,
      this.test.query,
    );
    flowResult(queryState.updateLamba(this.test.query)).catch(
      this.editorStore.applicationStore.alertUnhandledError,
    );
    return queryState;
  }
}

export class MappingDataTestState extends MappingTestState {
  override test: MappingDataTest;
  dataState: MappingTestableDataState;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
    test: MappingDataTest,
  ) {
    super(editorStore, mappingTestableState, test);
    makeObservable(this, {
      defaultTab: observable,
      selectedAsertionState: observable,
      selectedTab: observable,
      assertionToRename: observable,
      assertionEditorStates: observable,
      testResultState: observable,
      runningTestAction: observable,
      addAssertion: action,
      setAssertionToRename: action,
      handleTestResult: action,
      setSelectedTab: action,
      runTest: flow,
      test: observable,
    });
    this.test = test;
    this.dataState = new MappingTestableDataState(
      this.editorStore,
      mappingTestableState,
      test,
    );
  }

  override defaultTab(): TESTABLE_TEST_TAB {
    // return this.test.storeTestData.length
    //   ? TESTABLE_TEST_TAB.ASSERTIONS
    //   : TESTABLE_TEST_TAB.SETUP;
    return TESTABLE_TEST_TAB.SETUP;
  }
}

export abstract class MappingTestSuiteState {
  readonly editorStore: EditorStore;
  readonly mappingTestableState: MappingTestableState;
  readonly uuid = uuid();
  suite: MappingTestSuite;
  testsStates: MappingTestState[] = [];
  selectTestState: MappingTestState | undefined;
  showCreateModal = false;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
    suite: MappingTestSuite,
  ) {
    this.editorStore = editorStore;
    this.mappingTestableState = mappingTestableState;
    this.suite = suite;
    this.testsStates = this.buildTestStates();
    this.selectTestState = this.testsStates[0];
  }

  buildTestStates(): MappingTestState[] {
    return this.suite.tests
      .map((t) => this.buildTestState(t))
      .filter(isNonNullable);
  }

  abstract buildTestState(val: MappingTest): MappingTestState | undefined;

  addNewTest(id: string, _class: Class | undefined): void {
    const test = this.createNewTest(id, _class);
    testSuite_addTest(
      this.suite,
      test,
      this.mappingTestableState.editorStore.changeDetectionState
        .observerContext,
    );
    const testState = this.buildTestState(test);
    if (testState) {
      this.testsStates.push(testState);
    }
    this.selectTestState = testState;
  }

  abstract createNewTest(id: string, _class: Class | undefined): MappingTest;

  setShowModal(val: boolean): void {
    this.showCreateModal = val;
  }

  runTests(): void {
    // TODO
  }

  runFailingTests(): void {
    // console
  }

  changeTest(val: MappingTest): void {
    if (this.selectTestState?.test !== val) {
      this.selectTestState = this.testsStates.find(
        (testState) => testState.test === val,
      );
    }
  }

  deleteTest(val: MappingTest): void {
    testSuite_deleteTest(this.suite, val);
    this.removeTestState(val);
    if (this.selectTestState?.test === val) {
      this.selectTestState = this.testsStates[0];
    }
  }

  removeTestState(val: MappingTest): void {
    this.testsStates = this.testsStates.filter((e) => e.test !== val);
  }
}

export class MappingDataTestSuiteState extends MappingTestSuiteState {
  override suite: MappingDataTestSuite;
  dataState: MappingTestableDataState;
  declare testsStates: MappingQueryTestState[];
  declare selectTestState: MappingQueryTestState | undefined;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
    suite: MappingDataTestSuite,
  ) {
    super(editorStore, mappingTestableState, suite);
    makeObservable(this, {
      testsStates: observable,
      selectTestState: observable,
      showCreateModal: observable,
      buildTestStates: action,
      changeTest: action,
      deleteTest: action,
      removeTestState: action,
      addNewTest: action,
      setShowModal: action,
    });
    this.suite = suite;
    this.dataState = new MappingTestableDataState(
      this.editorStore,
      mappingTestableState,
      suite,
    );
  }
  override buildTestState(val: MappingTest): MappingTestState | undefined {
    if (val instanceof MappingQueryTest) {
      return new MappingQueryTestState(
        this.editorStore,
        this.mappingTestableState,
        val,
      );
    }
    return undefined;
  }

  override createNewTest(id: string, _class: Class | undefined): MappingTest {
    const query = _class
      ? this.mappingTestableState.createSuiteState.createDefaultQuery(_class)
      : stub_RawLambda();
    return createBareMappingQueryTest(id, query);
  }
}

export class MappingQueryTestSuiteState extends MappingTestSuiteState {
  override suite: MappingQueryTestSuite;
  declare testsStates: MappingDataTestState[];
  declare selectTestState: MappingDataTestState | undefined;
  queryState: MappingTestableQueryState;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
    suite: MappingQueryTestSuite,
  ) {
    super(editorStore, mappingTestableState, suite);
    makeObservable(this, {
      queryState: observable,
      testsStates: observable,
      selectTestState: observable,
      showCreateModal: observable,
      deleteTest: action,
      buildTestStates: action,
      buildQueryState: action,
      addNewTest: action,
      changeTest: action,
      setShowModal: action,
    });
    this.suite = suite;
    this.queryState = this.buildQueryState();
  }

  override buildTestState(val: MappingTest): MappingTestState | undefined {
    if (val instanceof MappingDataTest) {
      return new MappingDataTestState(
        this.editorStore,
        this.mappingTestableState,
        val,
      );
    }
    return undefined;
  }

  override createNewTest(id: string, _class: Class | undefined): MappingTest {
    return createBareMappingDataTest(id, undefined);
  }
  buildQueryState(): MappingTestableQueryState {
    const queryState = new MappingTestableQueryState(
      this.editorStore,
      this.suite,
      this.suite.query,
    );
    flowResult(queryState.updateLamba(this.suite.query)).catch(
      this.editorStore.applicationStore.alertUnhandledError,
    );
    return queryState;
  }
}

export class CreateSuiteState {
  readonly editorStore: EditorStore;
  readonly mappingTestableState: MappingTestableState;
  showModal = false;

  constructor(
    editorStore: EditorStore,
    mappingTestableState: MappingTestableState,
  ) {
    this.editorStore = editorStore;
    this.mappingTestableState = mappingTestableState;

    makeObservable(this, {
      showModal: observable,
      setShowModal: action,
      createAndAddTestSuite: flow,
    });
  }

  setShowModal(val: boolean): void {
    this.showModal = val;
  }

  *createAndAddTestSuite(
    _class: Class,
    type: MAPPING_TEST_SUITE_TYPE,
    name: string,
  ): GeneratorFn<void> {
    // type
    try {
      const mappingTestableState = this.mappingTestableState;
      if (!mappingTestableState.mappingModelCoverageAnalysisResult) {
        yield flowResult(mappingTestableState.analyzeMappingModelCoverage());
      }
      const rootSetImpl = getRootSetImplementation(
        this.mappingTestableState.mapping,
        _class,
      );
      const query = this.createDefaultQuery(_class);
      const storeTestData = rootSetImpl
        ? this.attemptToGenerateTestData(rootSetImpl)
        : undefined;
      let testSuite: MappingTestSuite;
      const test1 = `test_1`;
      const assertionId = 'assertion_1';
      if (type === MAPPING_TEST_SUITE_TYPE.DATA) {
        const dataSuite = new MappingDataTestSuite();
        dataSuite.storeTestData = storeTestData ? [storeTestData] : [];
        const test = new MappingQueryTest();
        dataSuite.tests = [
          createBareMappingQueryTest(`${_class.name}_test_1`, query),
        ];
        // add assertion
        test.assertions = [createDefaultEqualToJSONTestAssertion(assertionId)];
        testSuite = dataSuite;
      } else {
        const querySuite = new MappingQueryTestSuite();
        querySuite.query = query;
        testSuite = querySuite;
        // add test
        querySuite.tests = [createBareMappingDataTest(test1, storeTestData)];
      }
      testSuite.id = name;
      mapping_addTestSuite(
        this.mappingTestableState.mapping,
        testSuite,
        this.editorStore.changeDetectionState.observerContext,
      );
      this.mappingTestableState.changeSuite(testSuite);
    } catch (error) {
      assertErrorThrown(error);
      this.editorStore.applicationStore.notificationService.notifyError(
        `Unable to create to test suite: ${error.message}`,
      );
    } finally {
      this.setShowModal(false);
    }
  }

  createDefaultQuery(_class: Class): RawLambda {
    try {
      const mappingTestableState = this.mappingTestableState;
      const anaylsis = guaranteeNonNullable(
        mappingTestableState.mappingModelCoverageAnalysisResult,
      );
      const mappedEntity = guaranteeNonNullable(
        anaylsis.mappedEntities.find((e) => e.path === _class.path),
      );
      const rootTree = new RootGraphFetchTree(
        PackageableElementExplicitReference.create(_class),
      );
      // TODO: allow complex properties
      mappedEntity.properties.forEach((e) => {
        if (!(e instanceof EntityMappedProperty)) {
          const name = e.name;
          const property = getAllClassProperties(_class)
            .concat(
              // we fetch mapped derived properties without parameters
              getAllClassDerivedProperties(_class).filter(
                (p) => !p.parameters || !(p.parameters as object[]).length,
              ),
            )
            .find((prop) => prop.name === name);
          if (property) {
            const subTree = new PropertyGraphFetchTree(
              PropertyExplicitReference.create(property),
              undefined,
            );
            rootTree.subTrees.push(subTree);
          }
        }
      });
      assertTrue(!rootTree.isEmpty);
      return createGraphFetchLambda(
        _class,
        this.editorStore.graphManagerState,
        rootTree,
      );
    } catch (error) {
      assertErrorThrown(error);
      const lambdaFunction = new LambdaFunction(
        new FunctionType(
          PackageableElementExplicitReference.create(
            this.editorStore.graphManagerState.graph.getType(
              CORE_PURE_PATH.ANY,
            ),
          ),
          Multiplicity.ONE,
        ),
      );
      lambdaFunction.expressionSequence = [
        buildGetAllFunction(_class, Multiplicity.ONE),
      ];
      return buildRawLambdaFromLambdaFunction(
        lambdaFunction,
        this.editorStore.graphManagerState,
      );
    }
  }

  // change to use api call for relational
  attemptToGenerateTestData(
    setImpl: SetImplementation,
  ): StoreTestData | undefined {
    if (
      setImpl instanceof RelationalInstanceSetImplementation ||
      setImpl instanceof EmbeddedRelationalInstanceSetImplementation ||
      setImpl instanceof EmbeddedRelationalInstanceSetImplementation
    ) {
      const _store = resolveMappingSourceToStore(
        getMappingElementSource(
          setImpl,
          this.editorStore.pluginManager.getApplicationPlugins(),
        ),
      );
      if (_store instanceof Database) {
        const _storeData = new StoreTestData();
        _storeData.store = PackageableElementExplicitReference.create(_store);
        _storeData.data = new RelationalCSVData();
        return _storeData;
      }
    } else if (setImpl instanceof PureInstanceSetImplementation) {
      const srcClass = setImpl.srcClass;
      if (srcClass) {
        const embeddedData = createEmbeddedDataFromClass(
          srcClass.value,
          this.editorStore,
        );
        const testData = new StoreTestData();
        testData.data = embeddedData;
        testData.store = PackageableElementExplicitReference.create(
          ModelStore.INSTANCE,
        );
        return testData;
      }
    }
    return undefined;
  }
}

export class MappingTestableState {
  readonly editorStore: EditorStore;
  readonly mappingEditorState: MappingEditorState;
  selectedTestSuite: MappingTestSuiteState | undefined;
  testableComponentToRename:
    | MappingTestSuite
    | MappingTest
    | TestAssertion
    | undefined;
  // state
  createSuiteState: CreateSuiteState;
  mappingModelCoverageAnalysisState = ActionState.create();
  mappingModelCoverageAnalysisResult:
    | MappingModelCoverageAnalysisResult
    | undefined;

  constructor(
    editorStore: EditorStore,
    mappingEditorState: MappingEditorState,
  ) {
    makeObservable(this, {
      mappingModelCoverageAnalysisResult: observable,
      mappingModelCoverageAnalysisState: observable,
      selectedTestSuite: observable,
      testableComponentToRename: observable,
      renameTestableComponent: observable,
      changeSuite: action,
      init: action,
      deleteTestSuite: action,
      analyzeMappingModelCoverage: flow,
      setRenameComponent: action,
    });

    this.editorStore = editorStore;
    this.mappingEditorState = mappingEditorState;
    this.createSuiteState = new CreateSuiteState(this.editorStore, this);
    this.init();
  }

  get mapping(): Mapping {
    return this.mappingEditorState.mapping;
  }

  renameTestableComponent(val: string | undefined): void {
    const _component = this.testableComponentToRename;
    if (_component) {
      testable_setId(_component, val ?? '');
    }
  }

  init(): void {
    // TODO: ? should we add a test suite here by default if certain things
    const suite = this.mapping.tests[0];
    this.selectedTestSuite = suite
      ? this.buildTestSuiteState(suite)
      : undefined;
  }

  changeSuite(suite: MappingTestSuite): void {
    if (this.selectedTestSuite?.suite !== suite) {
      this.selectedTestSuite = this.buildTestSuiteState(suite);
    }
  }

  setRenameComponent(
    testSuite: MappingTestSuite | AtomicTest | undefined,
  ): void {
    this.testableComponentToRename = testSuite;
  }

  deleteTestSuite(testSuite: MappingTestSuite): void {
    mapping_deleteTestSuite(this.mapping, testSuite);
    if (this.selectedTestSuite?.suite === testSuite) {
      this.init();
    }
  }

  buildTestSuiteStates(): MappingTestSuiteState[] {
    return this.mapping.tests
      .map((suite) => this.buildTestSuiteState(suite))
      .filter(isNonNullable);
  }

  buildTestSuiteState(
    val: MappingTestSuite,
  ): MappingTestSuiteState | undefined {
    if (val instanceof MappingQueryTestSuite) {
      return new MappingQueryTestSuiteState(this.editorStore, this, val);
    } else if (val instanceof MappingDataTestSuite) {
      return new MappingDataTestSuiteState(this.editorStore, this, val);
    }
    return undefined;
  }

  // check to only anaylsis when mapping has changed
  *analyzeMappingModelCoverage(): GeneratorFn<void> {
    this.mappingModelCoverageAnalysisState.inProgress();
    this.mappingModelCoverageAnalysisState.setMessage('Analyzing Mapping...');
    try {
      this.mappingModelCoverageAnalysisResult = (yield flowResult(
        this.editorStore.graphManagerState.graphManager.analyzeMappingModelCoverage(
          this.mapping,
          this.editorStore.graphManagerState.graph,
        ),
      )) as MappingModelCoverageAnalysisResult;
    } catch (error) {
      assertErrorThrown(error);
      this.editorStore.applicationStore.notificationService.notifyError(
        error.message,
      );
    } finally {
      this.mappingModelCoverageAnalysisState.complete();
    }
  }

  runAllSuites(): void {
    // TODO
  }

  runAllFailingSuites(): void {
    // TODO
  }
}
