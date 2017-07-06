import _ from 'underscore';

import SearchFieldWidget from 'girder/views/widgets/SearchFieldWidget';
import View from 'girder/views/View';

import 'girder/utilities/jquery/girderEnable';
import 'girder/utilities/jquery/girderModal';

import SelectTaskViewDialogTemplate from '../templates/selectTaskViewDialog.pug';
import selectTaskViewDescriptionTemplate from '../templates/selectTaskViewTargetDescription.pug';

import '../stylesheets/selectTaskView.styl';

/**
 * A dialog for creating tasks from a specific item.
 */
var SelectTaskView = View.extend({
    events: {
        'submit #g-select-task-form': function (e) {
            e.preventDefault();
            this.$('.g-submit-select-task').girderEnable(false);

            this.trigger('g:selected', {
                itemId: this.item.id,
                taskId: this.taskId
            });
        }
    },

    initialize: function (settings) {
        this.item = settings.item;
        this.taskId;

        this.searchWidget = new SearchFieldWidget({
            placeholder: 'Start typing a task name...',
            types: ['item'],
            modes: ['prefix'],
            parentView: this
        }).on('g:resultClicked', this.pickTarget, this);
    },

    render: function () {
        this.$el.html(SelectTaskViewDialogTemplate({
            item: this.item
        })).girderModal(this).on('shown.bs.modal', () => {
            this.$('#g-task-width').focus();
        });

        this.$('#g-task-width').focus();

        this.searchWidget.setElement(this.$('.g-search-field-container')).render();
        this.$('.g-submit-select-task').girderEnable(false);

        return this;
    },

    pickTarget: function (target) {
        this.searchWidget.resetState();
        this.taskId = target.id;
        this.$('.g-submit-select-task').girderEnable(true);

        this.$('.g-target-result-container').html(selectTaskViewDescriptionTemplate({
            text: target.text,
            icon: target.icon
        }));
    }
});

export default SelectTaskView;
