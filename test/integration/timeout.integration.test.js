/**
 * © Copyright IBM Corporation 2021. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const assert = require('assert');
const sinon = require('sinon');

const {
  BasicAuthenticator,
  IamAuthenticator,
  NoAuthAuthenticator,
} = require('ibm-cloud-sdk-core');
const { CloudantV1 } = require('../../index.ts');
const { CouchdbSessionAuthenticator } = require('../../index.ts');

const DEFAULT_TIMEOUT = 150000; // (2.5m=150s)
const CUSTOM_TIMEOUT = 30000; // (30s)

// Every method tests an authenticator.
describe('Default timeout config tests', () => {
  // Every test case tests a timeout settings.
  const testCases = [
    // 1. case: check default timeout value
    {
      options: {},
      expTimeout: DEFAULT_TIMEOUT,
    },
    // 2. case: check custom timeout overwrite
    {
      options: {
        timeout: CUSTOM_TIMEOUT,
      },
      expTimeout: CUSTOM_TIMEOUT,
    },
  ];

  function assertBaseTimeoutOptions(myService, expTimeoutValue) {
    assert.ok(myService.baseOptions.timeout);
    assert.equal(myService.baseOptions.timeout, expTimeoutValue);
  }

  it('CloudantV1 - BasicAuth', () => {
    const basicAuth = new BasicAuthenticator({
      username: 'user',
      password: 'pwd',
    });
    testCases.forEach((tc) => {
      const myService = new CloudantV1({
        authenticator: basicAuth,
        ...tc.options,
      });
      assertBaseTimeoutOptions(myService, tc.expTimeout);
    });
  });

  it('newInstance - NoAuth', () => {
    const noAuth = new NoAuthAuthenticator();
    testCases.forEach((tc) => {
      const myService = new CloudantV1({
        authenticator: noAuth,
        ...tc.options,
      });
      assertBaseTimeoutOptions(myService, tc.expTimeout);
    });
  });

  function assertAuthTokenTimeoutOptions(myService, expTimeoutValue) {
    const auth = myService.getAuthenticator();
    assert.ok(auth.tokenOptions.timeout);
    assert.equal(auth.tokenOptions.timeout, expTimeoutValue);
  }

  it('CloudantV1 - SessionAuth', () => {
    const sessionAuth = new CouchdbSessionAuthenticator({
      username: 'name',
      password: 'pwd',
    });
    testCases.forEach((tc) => {
      const myService = new CloudantV1({
        authenticator: sessionAuth,
        ...tc.options,
      });
      assertBaseTimeoutOptions(myService, tc.expTimeout);
      assertAuthTokenTimeoutOptions(myService, tc.expTimeout);
    });
  });

  function assertIamAuthRequestTimeout(myService, expValue) {
    const auth = myService.getAuthenticator();
    const spyAuth = sinon.spy(auth, 'authenticate');

    // Mock out server calls
    const getTokenStubFn = sinon.stub(auth.tokenManager, 'getToken');
    getTokenStubFn.returns(
      new Promise((resolve) => {
        resolve('apikey');
      })
    );
    const sendRequestStubFn = sinon.stub(
      myService.requestWrapperInstance,
      'sendRequest'
    );
    sendRequestStubFn.returns(
      new Promise((resolve) => {
        resolve('response');
      })
    );

    return myService.getServerInformation().then((response) => {
      assert.ok(response);
      assert.ok(spyAuth.calledOnce);
      assert.ok(getTokenStubFn.calledOnce);
      // authenticate is called with default timeout
      sinon.assert.calledWith(spyAuth, sinon.match.has('timeout', expValue));
      // server request is called with default timeout
      assert.ok(sendRequestStubFn.calledOnce);
      sinon.assert.calledWith(
        sendRequestStubFn,
        sinon.match.hasNested('defaultOptions.timeout', expValue)
      );
      // restore stubbed functions
      getTokenStubFn.restore();
      sendRequestStubFn.restore();
    });
  }

  it('newInstance - IamAuth', () => {
    testCases.forEach((tc) => {
      const iamAuth = new IamAuthenticator({
        apikey: 'apikey',
      });
      const myService = new CloudantV1({
        authenticator: iamAuth,
        ...tc.options,
      });
      assertBaseTimeoutOptions(myService, tc.expTimeout);
      return assertIamAuthRequestTimeout(myService, tc.expTimeout);
    });
  });
});
