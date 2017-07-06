/* eslint-disable import/first */

import $ from 'jquery';

import router from 'girder/router';
import events from 'girder/events';

import ItemModel from 'girder/models/ItemModel';
import JobModel from 'girder_plugins/jobs/models/JobModel';

import TaskListView from './views/TaskListView';
import TaskRunView from './views/TaskRunView';

router.route('item_tasks', 'itemTaskList', () => {
    events.trigger('g:navigateTo', TaskListView);
    events.trigger('g:highlightItem', 'TasksView');
});

router.route('item_task/:id/run', (id, params) => {
    const itemTask = new ItemModel({_id: id});
    let job = null;
    const promises = [itemTask.fetch()];

    if (params.fromJob) {
        job = new JobModel({_id: params.fromJob});
        promises.push(job.fetch());
    }

    $.when.apply($, promises).done(() => {
        events.trigger('g:navigateTo', TaskRunView, {
            model: itemTask,
            initialValues: job && job.get('itemTaskBindings')
        }, {
            renderNow: true
        });
    }).fail(() => {
        router.navigate('item_tasks', {trigger: true});
    });
});
