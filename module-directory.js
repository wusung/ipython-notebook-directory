
var nbname = '';
var session = {};
var sessions = {};

define(function (require) {
	'use strict';
	window.console && console.log('module-directory loaded');

	var IPython = require('base/js/namespace');
	var events = require('base/js/events');
	var sesssionlist = require('tree/js/sessionlist');

	require('../module-sidebar/module-sidebar');
	require('../dir-directory/jquery.cookie');
	require('../dir-directory/jquery-treeview/jquery.treeview');
	require('../dir-directory/jquery-treeview/jquery.treeview.async');
	require('../dir-directory/jquery-contextMenu/jquery.contextMenu');
	require('../dir-directory/jquery-contextMenu/jquery.ui.position');
	
	IPython.sessions = {};

	var ext_path = '../nbextensions/dir-tabs';
	$("head").append($("<link rel='stylesheet' href='../nbextensions/dir-directory/module-directory.css' type='text/css' />"));

	var opts = {
        base_url : IPython.utils.get_body_data("baseUrl"),
        notebook_path : IPython.utils.get_body_data("notebookPath"),
        events : events,
    };
    IPython.session_list = new sesssionlist.SesssionList(opts);
    IPython.session_list.load_sessions();

    $([IPython.events]).on('sessions_loaded.Dashboard', 
            function(e, d) {
        this.sessions = d;
        IPython.sessions = d;
	});

   	var list_loaded = function (data, status, xhr, param) {
   		
    	var len = data.content.length;
    	var content = data.content;

    	if (len > 0) {
    		$('<ul id="directory-tree" class="filetree"></ul>')
    			.appendTo('#sidebar-dir.tab-pane');
    	}
    	for (var i=0; i<len; i++) {
			var item = content[len];
			if (content[i].type === 'directory') {
				$('<li class="context-menu-one box menu-1"></li>')
					.append('<span class="folder">' + content[i].name + '</span>' + 
						'<ul><li><span class="placeholder">&nbsp;</span></li></ul>')
					.appendTo('#directory-tree');
			} else {
				$('<li class=" context-menu-one box menu-1"></li>')
					.append('<span class="file"><a href="' + content[i].name + '">' + content[i].name + '</a></span>')
					.appendTo('#directory-tree');
			}
    	}

    	$('#directory').tab('show');
    	$('#directory-tree .file a').click(function () {

    	});

		$('#directory-tree').treeview({
			animated: "fast",
			collapsed: true,
			unique: true,
			persist: "cookie",
			"toggle": function() {
				window.console && console.log("%o was toggled", this);
			}
		});

		$.contextMenu({
	        selector: '.context-menu-one', 
	        callback: function(key, options) {
	        	nbname = $(this).find('a').html();
	            var m = "clicked: " + key;
	            window.console && console.log(m);
				if (key == 'delete') {					
					delete_notebook();
		        } else if (key == 'add') {
		        	new_notebook();
		        } else if (key == 'shutdown') {
		        	shutdown_notebook();
		        } else if (key == 'rename') {
		        	rename_notebook(this);
		        	//$.proxy(rename_notebook, this);
		        }
	        },
	        items: {
	            "delete": {name: "Delete", icon: "delete"},
	            "add": {name: "Add", icon: "add"},
	            "rename": {name: "Rename", icon: "quit"},
	            "shutdown": {name: "Shutdown", icon: "quit"}
	        }
	    });
	    
	    $('.context-menu-one').on('click', function(e){
	        console.log('clicked', this);
	        
	    })

	    var rename_notebook = function (container) {

			var dialog = $('<div/>').append(
	            $("<p/>").addClass("rename-message")
	                .text('Enter a new notebook name:')
	        ).append(
	            $("<br/>")
	        ).append(
	            $('<input/>').attr('type','text').attr('size','25')
	            	.val(nbname.substring(0,nbname.length-6))
	        );

	        var x = $(container);
			IPython.dialog.modal({
	            title: "Rename Notebook",
	            body: dialog,
	            buttons : {
	                "Cancel": {},
	                "OK": {
	                    class: "btn-primary",
	                    click: function () {
	                    var new_name = $(this).find('input').val();
	                    if (!IPython.notebook.test_notebook_name(new_name)) {
	                        $(this).find('.rename-message').text(
	                            "Invalid notebook name. Notebook names must "+
	                            "have 1 or more characters and can contain any characters " +
	                            "except :/\\. Please enter a new notebook name:"
	                        );
	                        return false;
	                    } else {
	                        IPython.notebook.rename(new_name);
	                        x.find('.file').find('a').remove();
	        				$('<a>' + new_name + '.ipynb' + '</a>').attr('href', new_name + '.ipynb')
	        					.appendTo(x.find('.file'))
	                    }
	                }}
	                },
	            open : function (event, ui) {
	                var that = $(this);
	                // Upon ENTER, click the OK button.
	                that.find('input[type="text"]').keydown(function (event, ui) {
	                    if (event.which === IPython.keyboard.keycodes.enter) {
	                        that.find('.btn-primary').first().click();
	                        return false;
	                    }
	                });
	                that.find('input[type="text"]').focus().select();
	            }
	        });
	    }	    
   	};

    var settings = {
        processData : false,
        cache : false,
        type : "GET",
        dataType : "json",
        success : $.proxy(list_loaded, this),
        error : $.proxy( function(xhr, status, error){
            IPython.utils.log_ajax_error(xhr, status, error);
            list_loaded([], null, null, {msg:"Error connecting to server."});
                         },this)
    };

    var url = IPython.utils.url_join_encode(
                '../',
                'api',
                'notebooks'
        );

	$.ajax(url, settings);

	var shutdown_notebook = function () {
		var session = IPython.sessions[nbname];
        var settings = {
            processData : false,
            cache : false,
            type : "DELETE",
            dataType : "json",
            success : function () {
                //that.load_sessions();
            },
            error : IPython.utils.log_ajax_error,
        };
        var url = IPython.utils.url_join_encode(
            '../',
            'api/sessions',
            session
        );
        $.ajax(url, settings);
	}

	var load_sessions = function(){
        IPython.session_list.load_sessions();
    };

	var delete_notebook = function () {

		var message = 'Are you sure you want to permanently delete the notebook: ' + nbname + '?';
		IPython.dialog.modal({
			title : "Delete notebook",
			body : message,
			buttons : {
				Delete: {
					class: "btn-danger",
					click: function () {
						var settings = {
				            processData : false,
				            cache : false,
				            type : "DELETE",
				            dataType : "json",
				            success : function (data, status, xhr) {
				                //parent_item.remove();
				                $('a[href="' + nbname + '"').parent().parent().remove();
				            },
				            error : IPython.utils.log_ajax_error,
				        };
				        var url = IPython.utils.url_join_encode(
				            '../',
				            'api/notebooks',
				            "",
				            nbname
				        );
				        $.ajax(url, settings);
					}
				},
				Cancel: {}
			}
		});
	}

	var new_notebook = function(){
        var path = '';
        var base_url = '../';
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            dataType : "json",
            async : false,
            success : function (data, status, xhr) {
                var notebook_name = data.name;
                window.location.replace(IPython.utils.url_join_encode(
                        base_url,
                        'notebooks',
                        path,
                        notebook_name));
            },
            error : $.proxy(new_notebook_failed, this),
        };
        var url = IPython.utils.url_join_encode(
            base_url,
            'api/notebooks',
            path
        );
        $.ajax(url, settings);
    };

    var new_notebook_failed = function (xhr, status, error) {
        IPython.utils.log_ajax_error(xhr, status, error);
        var msg;
        if (xhr.responseJSON && xhr.responseJSON.message) {
            msg = xhr.responseJSON.message;
        } else {
            msg = xhr.statusText;
        }
        IPython.dialog.modal({
            title : 'Creating Notebook Failed',
            body : "The error was: " + msg,
            buttons : {'OK' : {'class' : 'btn-primary'}}
        });
    }
});
