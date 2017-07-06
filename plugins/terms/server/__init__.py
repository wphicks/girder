#!/usr/bin/env python
# -*- coding: utf-8 -*-

###############################################################################
#  Copyright Kitware Inc.
#
#  Licensed under the Apache License, Version 2.0 ( the "License" );
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
###############################################################################

import base64
import hashlib

from girder import events
from girder.api import access
from girder.api.describe import Description, autoDescribeRoute
from girder.api.rest import boundHandler, RestException
from girder.constants import AccessType, TokenScope
from girder.models.model_base import ModelImporter


@access.user(scope=TokenScope.DATA_READ)
@boundHandler()
@autoDescribeRoute(
    Description('Accept a collection\'s Terms of Use for the current user.')
    .modelParam('id', model='collection', level=AccessType.READ)
    .param('termsHash', 'The SHA-256 hash of this collection\'s terms, encoded in Base64.')
)
def acceptCollectionTerms(self, collection, termsHash, params):
    if not collection.get('terms'):
        raise RestException('This collection currently has no terms.')

    # termsHash should be encoded to a bytes object, but storing bytes into MongoDB behaves
    # differently in Python 2 vs 3. Additionally, serializing a bytes to JSON behaves differently
    # in Python 2 vs 3. So, just keep it as a unicode (or ordinary Python 2 str).
    realTermsHash = base64.b64encode(
        hashlib.sha256(collection['terms'].encode('utf-8')).digest()
    ).decode('utf-8')
    if termsHash != realTermsHash:
        # This "proves" that the client has at least accessed the terms
        raise RestException(
            'The submitted "termsHash" does not correspond to the collection\'s current terms.')

    ModelImporter.model('user').update(
        {'_id': self.getCurrentUser()['_id']},
        {'$set': {'terms.collection.%s' % collection['_id']: termsHash}}
    )


def afterPostPutCollection(event):
    # This will only trigger if no exceptions (for access, invalid id, etc.) are thrown
    extraParams = event.info['params']
    if 'terms' in extraParams:
        collectionResponse = event.info['returnVal']
        collectionId = collectionResponse['_id']
        terms = extraParams['terms']

        ModelImporter.model('collection').update(
            {'_id': collectionId},
            {'$set': {'terms': terms}}
        )

        collectionResponse['terms'] = terms
        event.addResponse(collectionResponse)


def load(info):
    # Augment the collection creation and edit routes to accept a terms field
    events.bind('rest.post.collection.after', 'terms', afterPostPutCollection)
    events.bind('rest.put.collection/:id.after', 'terms', afterPostPutCollection)
    for route, handler, wildcards in [
        info['apiRoot'].collection._matchRoute('post', ()),  # createCollection
        info['apiRoot'].collection._matchRoute('put', (':id',))  # updateCollection
    ]:
        handler.description.param('terms', 'The Terms of Use for the collection.', required=False)

    # Expose the terms field on all collections
    ModelImporter.model('collection').exposeFields(level=AccessType.READ, fields={'terms'})

    # Add endpoint for registered users to accept terms
    info['apiRoot'].collection.route('POST', (':id', 'acceptTerms'), acceptCollectionTerms)

    # Expose the terms field on all users
    ModelImporter.model('user').exposeFields(level=AccessType.ADMIN, fields={'terms'})
