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
import { ChangesFollower, CloudantV1, Stream } from '../../../../../index';
import { ChangesResultItem, PostChangesParams } from '../../../../../cloudant/v1';

const client = CloudantV1.newInstance({});
const changesParams: PostChangesParams = {
  db: 'example'
};
const changesFollower: ChangesFollower = new ChangesFollower(client, changesParams);
const changesItemsStream: Stream<ChangesResultItem> = changesFollower.start();
// Create for-async-loop or pipeline to begin the flow of changes
// e.g. pipeline(changesItemsStream, destinationStream).then(() => { ... }).catch((err) => { ... });
