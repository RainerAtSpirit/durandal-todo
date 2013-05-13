﻿define(
	['durandal/app', 'ko', 'durandal/system', 'scripts/dataservice', 'scripts/model'], 
	function(app, ko, system, dataservice, model) {

	var self = this,
		current = ko.observable(), // store the new todo value being entered
		todos = ko.observableArray(),
		showMode = ko.observable('all');

	// internal computed observable that fires whenever anything changes in our todos
	//Todo: convert this to pub/sub
	ko.computed(function () {
		// store a clean copy to local storage, which also creates a dependency on the observableArray and all observables in each item
		localStorage.setItem('todos-durandal', ko.toJSON(todos));
	}).extend({
		throttle: 500
	}); // save at most twice per second

	return {
		current: current,
		todos: todos,
		showMode: showMode,
		add: add,
		remove: remove,
		removeCompleted: removeCompleted,
		editItem: editItem,
		stopEditing: stopEditing,
		getLabel: getLabel,
		beforeBind: function(){
			addComputeds(self); //Add the Knockout computeds
		},
		afterBind: function(){
			dataservice.getTodos(todos); //Fetch the todos
			system.log('Total stored todos received: ' + todos().length);
			system.log(todos());
		},
		viewAttached: function () {
			system.log('Total todos: ' + todos().length);
			return;
		}
	};

	function addComputeds(entity){
		system.log('Todos\' Knockout computes added.');

		//filter the todos based on the completion status
		entity.filteredTodos = ko.computed(function () {
			switch (showMode()) {
				case 'active':
					return todos().filter(function (todo) {
						return !todo.completed();
					});
				case 'completed':
					return todos().filter(function (todo) {
						return todo.completed();
					});
				default:
					return todos();
			}
		});

		// count of all completed todos
		entity.completedCount = ko.computed(function () {
			return ko.utils.arrayFilter(todos(), function (todo) {
				return todo.completed();
			}).length;
		});

		// count of todos that are not complete
		entity.remainingCount = ko.computed(function () {
			return todos().length - completedCount();
		});

		// writeable computed observable to handle marking all complete/incomplete
		entity.allCompleted = ko.computed({
			//always return true/false based on the done flag of all todos
			read: function () {
				return !remainingCount();
			},
			// set all todos to the written value (true/false)
			write: function (newValue) {
				ko.utils.arrayForEach(todos(), function (todo) {
					// set even if value is the same, as subscribers are not notified in that case
					todo.completed(newValue);
				});
			}
		});
	}


	// add a new todo, when enter key is pressed
	function add () {
		var current = current().trim();
		if (current) {
			todos.push(new model.Todo(current));
			current('');
		}
	}

	// remove a single todo
	function remove (todo) {
		todos.remove(todo);
	}

	// remove all completed todos
	function removeCompleted() {
		todos.remove(function (todo) {
			return todo.completed();
		});
	}

	// edit an item
	function editItem(item) {
		item.editing(true);
	}

	// stop editing an item.  Remove the item, if it is now empty
	function stopEditing (item) {
		item.editing(false);

		if (!item.title().trim()) {
			remove(item);
		}
	}

	// helper function to keep expressions out of markup
	function getLabel (count) {
		return ko.utils.unwrapObservable(count) === 1 ? 'item' : 'items';
	}
});