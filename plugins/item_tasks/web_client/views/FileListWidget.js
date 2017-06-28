import $ from 'jquery';
import Backbone from 'backbone';

import FileListWidget from 'girder/views/widgets/FileListWidget';
import router from 'girder/router';
import { AccessType } from 'girder/constants';
import { wrap } from 'girder/utilities/PluginUtils';

import FileListViewSelectTaskButtonTemplate from '../templates/fileListViewSelectTaskButton.pug';

import SelectTaskView from './SelectTaskView';

// Add select task link to each file in the file list
wrap(FileListWidget, 'render', function (render) {
    render.call(this);

    if (this.parentItem.getAccessLevel() >= AccessType.WRITE) {
        this.$('.g-file-actions-container').prepend(FileListViewSelectTaskButtonTemplate());
        this.$('.g-select-task').tooltip({
            container: 'body',
            placement: 'auto',
            delay: 100
        });
    }
    return this;
});

// Bind the task selection button
FileListWidget.prototype.events['click a.g-select-task'] = function (e) {
    var cid = $(e.currentTarget).parent().attr('file-cid');

    new SelectTaskView({
        el: $('#g-dialog-container'),
        parentView: this,
        item: this.parentItem,
        file: this.collection.get(cid)
    }).once('g:created', function (params) {
        Backbone.history.fragment = null;
        router.navigate(params.attachedToType + '/' + params.attachedToId, {trigger: true});
    }, this).render();
};
