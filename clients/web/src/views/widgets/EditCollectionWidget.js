import $ from 'jquery';

import CollectionModel from 'girder/models/CollectionModel';
import View from 'girder/views/View';
import MarkdownWidget from 'girder/views/widgets/MarkdownWidget';
import { handleClose, handleOpen } from 'girder/dialog';

import EditCollectionWidgetTemplate from 'girder/templates/widgets/editCollectionWidget.pug';

import 'girder/utilities/jquery/girderEnable';
import 'girder/utilities/jquery/girderModal';

/**
 * This widget is used to create a new collection or edit an existing one.
 */
const EditCollectionWidget = View.extend({
    events: {
        'submit #g-collection-edit-form': function (e) {
            e.preventDefault();

            let fields = {
                name: this.$('#g-name').val(),
                description: this.descriptionEditor.val()
            };

            this.descriptionEditor.saveText();
            this.$('button.g-save-collection').girderEnable(false);
            this.$('.g-validation-failed-message').text('');

            this._saveCollection(fields)
                .always(() => {
                    this.$('button.g-save-collection').girderEnable(true);
                })
                .done(() => {
                    this.$el.modal('hide');
                })
                .fail((err) => {
                    this.$('.g-validation-failed-message').text(err.responseJSON.message);
                    this.$('#g-' + err.responseJSON.field).focus();
                });
        }
    },

    initialize: function (settings) {
        this.create = !settings.model;
        this.model = settings.model || new CollectionModel();
        this.descriptionEditor = new MarkdownWidget({
            text: this.model ? this.model.get('description') : '',
            prefix: 'collection-description',
            placeholder: 'Enter a description',
            enableUploads: false,
            parentView: this
        });
    },

    render: function () {
        this.$el.html(EditCollectionWidgetTemplate({
            create: this.create,
            collection: this.model
        }));
        let modal = this.$el
            .girderModal(this)
            .on('shown.bs.modal', () => {
                this.$('#g-name').focus();
            })
            .on('hidden.bs.modal', () => {
                handleClose(this.create ? 'create' : 'edit');
            })
            .on('ready.girder.modal', () => {
                if (!this.create) {
                    this.$('#g-name').val(this.model.get('name'));
                    this.$('#g-description').val(this.model.get('description'));
                }
            });
        modal.trigger($.Event('ready.girder.modal', {relatedTarget: modal}));
        this.descriptionEditor.setElement(this.$('.g-description-editor-container')).render();
        this.$('#g-name').focus();

        handleOpen(this.create ? 'create' : 'edit');

        return this;
    },

    createCollection: function (fields) {
        console.warn('The createCollection method is deprecated; use _saveCollection instead');
        this._saveCollection(fields);
    },

    updateCollection: function (fields) {
        console.warn('The updateCollection method is deprecated; use _saveCollection instead');
        this._saveCollection(fields);
    },

    _saveCollection: function (fields) {
        this.model.set(fields);
        return this.model.save()
            .done(() => {
                this.trigger('g:saved', this.model);
            });
    }
});

export default EditCollectionWidget;
