/**
 * editableText plugin that uses contentEditable property (FF2 is not supported)
 * Project page - http://github.com/valums/editableText
 * Copyright (c) 2009 Andris Valums, http://valums.com
 * Licensed under the MIT license (http://valums.com/mit-license/)
 */
(function(){
    /**
     * The dollar sign could be overwritten globally,
     * but jQuery should always stay accesible
     */
    var $ = jQuery;
	/**
     * Extending jQuery namespace, we
     * could add public methods here
     */
	$.editableText = {};
    $.editableText.defaults = {
		/**
		 * Pass true to enable line breaks. Useful with divs that contain paragraphs.
		 * If false, prevents user from adding newlines to headers, links, etc.
		 */
		newlinesEnabled : false,
		/**
		 * Event that is triggered when editable text is changed
		 */
		changeEvent : 'change',
		compensateTopMargin: true,
		editTitle: 'Edit',
		saveTitle: 'Save',
		cancelTitle: 'Discard',
	};   		
	/**
	 * Usage $('selector).editableText(optionArray);
	 * See $.editableText.defaults for valid options 
	 */		
    $.fn.editableText = function( options ) {
        var options = $.extend({}, $.editableText.defaults, options);
        
        return this.each(function(){
             // Add jQuery methods to the element
            var editable = $(this);
            
			/**
			 * Save value to restore if user presses cancel
			 */
			var prevValue = editable.html();
			
			// Create edit/save buttons
            var buttons = $(
				"<div class='editableToolbar'>" +
            		"<a href='#' class='edit' title='" + options.editTitle + "'></a>" +
            		"<a href='#' class='save' title='" + options.saveTitle + "'></a>" +
            		"<a href='#' class='cancel' title='" + options.cancelTitle + "'></a>" +
            	"</div>")
				.insertBefore(editable);
			
			var edit = function( ev ) {
				ev.preventDefault();
				startEditing();
			}
			
			var save = function( ev ) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
				stopEditing();
				prevValue = editable.html();
				
				// Strip trailing ' <br>'; seems to occur (at least in FF) when doing <space><enter>,
				// even when cancelling the keyPress event.
				if ( !options.newlinesEnabled && prevValue.match( /<br>$/ ) ) {
					prevValue = prevValue.substr( 0, prevValue.length - 4 );
				}
				editable.trigger(options.changeEvent, [ prevValue ]);
			}
			
			var cancel = function( ev ) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
				stopEditing();
				editable.html( prevValue );
				return false;
			}
			
			// Save references and attach events
			var editEl = buttons.find('.edit').click( edit );
			buttons.find('.save').click( save );
			buttons.find('.cancel').click( cancel );
			
			// Display only edit button
			buttons.children().css('display', 'none');
			editEl.show();
			
			editable.dblclick( edit );
			// Bind on 'keydown' so we'll be first; for example, jQuery.ui.dialog closes the dialog on keydown for escape.
			editable.keydown( function( ev ) {
				// Save on enter, if not allowed to add newlines
				if ( ev.keyCode === 13 && !options.newlinesEnabled ) {
					save( ev );
				}
				// Cancel on escape
				if ( ev.keyCode === 27 ) {
					cancel( ev );
				}
			});
			
			options.compensateTopMargin && buttons.css( { 'margin-top': editable.css('margin-top') } );
			
			/**
			 * Makes element editable
			 */
			function startEditing() {
                buttons.children().show();
                editEl.hide();
	            editable.attr('contentEditable', true).focus();
			}
			/**
			 * Makes element non-editable
			 */
			function stopEditing() {
				buttons.children().hide();
				editEl.show().focus();
                editable.attr('contentEditable', false);
			}
        });
    }
})();