/**
 * © Copyright IBM Corporation 2023. All Rights Reserved.
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
const { ChangesFollower, CloudantV1 } = require('../../../../../index');
const { Writable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const client = CloudantV1.newInstance();
// Start from a previously persisted seq
// Normally this would be read by the app from persistent storage
// e.g. previouslyPersistedSeq = yourAppPersistenceReadFunc()
const previouslyPersistedSeq = '3-g1AG3...';
const changesParams = {
  db: 'example',
  since: previouslyPersistedSeq
};
const changesFollower = new ChangesFollower(client, changesParams);
const changesItemsStream = changesFollower.startOneOff();

const destinationStream = new Writable({
  objectMode: true,
  write(changesItem, _, callback) {
    // do something with change item
    console.log(changesItem.id);
    for (const change of changesItem.changes) {
      console.log(change.rev);
    }
    // when change item processing is complete app can store seq
    const seq = changesItem.seq;
    // write seq to persistent storage for use as since if required to resume later
    // e.g. yourAppPersistenceWriteFunc()
    callback();
  }
});

pipeline(changesItemsStream, destinationStream)
  .then(() => {
    console.log('All changes done');
  })
  .catch((err) => {
    console.log(err);
  });

// use for-async-loop feature for stream
/*
getChangesFromFollower(changesItemsStream);
async function getChangesFromFollower(changesItemsStream) {
  for await (const changesItem of changesItemsStream) {
    // do something with change item
    // write seq to persistent storage for use as since
    console.log(changesItem.id);
    for (const change of changesItem.changes) {
      console.log(change.rev);
    }
    // when change item processing is complete app can store seq
    seq = changesItem.seq;
    // write seq to persistent storage for use as since if required to resume later
    // e.g. yourAppPersistenceWriteFunc();
  }
}
*/
