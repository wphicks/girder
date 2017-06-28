import _ from 'underscore';

import SearchFieldWidget from 'girder/views/widgets/SearchFieldWidget';
import View from 'girder/views/View';

import 'girder/utilities/jquery/girderEnable';
import 'girder/utilities/jquery/girderModal';

import TaskSelectionModel from '../models/TaskSelectionModel';

import CreateThumbnailViewDialogTemplate from '../templates/tempThumb/createThumbnailViewDialog.pug';
import CreateThumbnailViewTargetDescriptionTemplate from '../templates/tempThumb/createThumbnailViewTargetDescription.pug';

import '../stylesheets/tempThumb/createThumbnailView.styl';

/**
 * A dialog for creating thumbnails from a specific file.
 */
var SelectTaskView = View.extend({
    events: {
        'submit #g-select-task-form': function (e) {
            e.preventDefault();

            console.log("CALLING select task form event");
            this.$('.g-validation-failed-message').empty();
            this.$('.g-submit-select-task').girderEnable(false);

            new TaskSelectionModel({
                width: Number(this.$('#g-task-width').val()) || 0,
                height: Number(this.$('#g-task-height').val()) || 0,
                crop: this.$('#g-task-crop').is(':checked'),
                fileId: this.file.id,
                attachToId: this.attachToId,
                attachToType: this.attachToType
            }).on('g:saved', function () {
                this.$el.on('hidden.bs.modal', _.bind(function () {
                    this.trigger('g:created', {
                        attachedToType: this.attachToType,
                        attachedToId: this.attachToId
                    });
                }, this)).modal('hide');
            }, this).on('g:error', function (resp) {
                this.$('.g-submit-select-task').girderEnable(true);
                this.$('.g-validation-failed-message').text(resp.responseJSON.message);
            }, this).save();
        }
    },

    initialize: function (settings) {
        console.log("CALLING INIT");
        this.item = settings.item;
        this.file = settings.file;
        this.attachToType = 'item';
        this.attachToId = this.item.id;
        this.$('.g-target-result-container').empty();
        this.$('.g-submit-select-task').girderEnable(false);

        this.searchWidget = new SearchFieldWidget({
            placeholder: 'Start typing a task name...',
            types: ['item'],
            parentView: this
        }).on('g:resultClicked', this.pickTarget, this);
    },

    render: function () {
        console.log("CALLING RENDER");
        var view = this;
        this.$el.html(CreateThumbnailViewDialogTemplate({
            file: this.file,
            item: this.item
        })).girderModal(this).on('shown.bs.modal', function () {
            view.$('#g-task-width').focus();
        });

        this.$('#g-task-width').focus();

        this.searchWidget.setElement(this.$('.g-search-field-container')).render();

        return this;
    },

    pickTarget: function (target) {
        this.searchWidget.resetState();
        this.attachToType = target.type;
        this.attachToId = target.id;
        this.$('.g-submit-select-task').girderEnable(true);

        this.$('.g-target-result-container').html(CreateThumbnailViewTargetDescriptionTemplate({
            text: target.text,
            icon: target.icon
        }));
    }
});

export default SelectTaskView;
