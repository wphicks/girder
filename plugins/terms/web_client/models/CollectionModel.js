import $ from 'jquery';
import createHash from 'sha.js';

import { getCurrentUser } from 'girder/auth';
import CollectionModel from 'girder/models/CollectionModel';
import { restRequest } from 'girder/rest';

const termsAcceptedFallback = {};

CollectionModel.prototype.hasTerms = function () {
    // An empty string also means there are no terms.
    return Boolean(this.get('terms'));
};

CollectionModel.prototype.currentUserHasAcceptedTerms = function () {
    const termsHash = this._hashTerms();
    const currentUser = getCurrentUser();
    if (currentUser) {
        const userAcceptedTerms = currentUser.get('terms');
        return userAcceptedTerms && userAcceptedTerms.collection &&
            (userAcceptedTerms.collection[this.id] === termsHash);
    } else {
        const storageKey = `terms.collection.${this.id}`;
        return (window.localStorage.getItem(storageKey) === termsHash) ||
               (termsAcceptedFallback[this.id] === termsHash);
    }
};

CollectionModel.prototype.currentUserSetAcceptTerms = function () {
    const termsHash = this._hashTerms();
    const currentUser = getCurrentUser();
    if (currentUser) {
        return restRequest({
            path: `collection/${this.id}/acceptTerms`,
            type: 'POST',
            data: {
                termsHash: termsHash
            }
        })
            .done(() => {
                // Even if this endpoint returned an updated copy of the user document, it wouldn't
                // be safe to just "setCurrentUser" with that document here, since the login method
                // performs some special transformations (e.g. setting a "token" attribute) before
                // instantiating a new UserModel, and it would be too fragile to reproduce those
                // here. We also don't want to trigger a brand-new login. So, just update the
                // currentUser's "terms" attribute in-place, triggering a "change" event.
                const userAcceptedTerms = currentUser.get('terms') || {};
                userAcceptedTerms.collection = userAcceptedTerms.collection || {};
                userAcceptedTerms.collection[this.id] = termsHash;
                currentUser.set('terms', userAcceptedTerms);
            });
    } else {
        const storageKey = `terms.collection.${this.id}`;
        try {
            window.localStorage.setItem(storageKey, termsHash);
        } catch (e) {
            termsAcceptedFallback[this.id] = termsHash;
        }
        return $.Deferred().resolve().promise();
    }
};

CollectionModel.prototype._hashTerms = function () {
    window.hex = createHash('sha256').update(this.get('terms'));
    return createHash('sha256').update(this.get('terms')).digest('base64');
};
