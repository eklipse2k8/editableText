/**
 * editableText plugin that uses contentEditable property (FF2 is not supported)
 * Project page - https://github.com/PaulUithol/editableText
 *
 * Supports the Showdown JS parser for markdown.
 *
 *
 * Forked from http://github.com/valums/editableText, copyright (c) 2009 Andris Valums, http://valums.com
 * Licensed under the MIT license (http://valums.com/mit-license/)
 */
(function( $ ){		
	/**
	 * Usage $('selector).editableText( options );
	 * See $.fn.editableText.defaults for valid options 
	 */
    $.fn.editableText = function( options ) {
		options = $.extend({}, $.fn.editableText.defaults, options);
		
        return this.each( function() {
			// Add jQuery methods to the element
			var editable = $(this);
			
			/**
			 * Save value to restore if user presses cancel
			 */
			var prevValue = editable.html();
			
			var markdown = options.allowMarkdown && Showdown && editable.data('markdown') != null;
			if ( markdown ) {
				var converter = new Showdown.converter();
				editable.html( converter.makeHtml( prevValue ) );
			}
			
			// Create edit/save buttons
			var buttons = $(
				"<div class='editableToolbar'>" +
					"<a href='#' class='edit' title='" + options.editTitle + "'></a>" +
					"<a href='#' class='save' title='" + options.saveTitle + "'></a>" +
					( options.showCancel ? "<a href='#' class='cancel' title='" + options.cancelTitle + "'></a>" : '' ) +
				"</div>")
				.insertBefore( editable )
				.css( { 'zIndex': ( parseInt( editable.css('zIndex'), 10 ) || 0 ) + 1 } );
			
			var edit = function( ev ) {
				ev.preventDefault();
				startEditing();
				markdown && editable.html( prevValue );
			}
			
			var save = function( ev ) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
				stopEditing();
				prevValue = editable.html();
				
				// If using 'markdown', replace all <br> by \n.
				if ( markdown ) {
					editable.html( converter.makeHtml( prevValue.replace(/<br>/gi, '\n') ) );
				}
				// Strip a trailing '<br>'; seems to occur (at least in FF) when typing <space>, then <enter>, even when cancelling the keydown event.
				if ( !options.newlinesEnabled && prevValue.match( /<br>$/ ) ) {
					prevValue = prevValue.substr( 0, prevValue.length - 4 );
				}
				
				editable.trigger( options.changeEvent, [ prevValue ] );
			}
			
			var cancel = function( ev ) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
				stopEditing();
				editable.html( markdown ? converter.makeHtml( prevValue.replace(/<br>/gi, '\n') )  : prevValue );
			}
			
			// Save references and attach events
			var editEl = buttons.find('.edit').click( edit );
			buttons.find('.save').click( save );
			buttons.find('.cancel').click( cancel );
			
			// Display only the 'edit' button by default
			buttons.children().css('display', 'none');
			editEl.show();
			
			// Bind on 'keydown' so we'll be first to handle keypresses, hopefully;
			// for example, jQuery.ui.dialog closes the dialog on keydown for escape.
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
			
			options.editOnDblClick && editable.dblclick( edit );
			options.compensateTopMargin && buttons.css( { 'margin-top': editable.css('margin-top') } );
			
			/**
			 * Trigger the 'save' function when the user clicks outside of both the 'editable', and outside of the 'buttons'.
			 */
			function saveOnClickOutside( ev ) {
				var target = $( ev.target );
				if ( !target.closest( editable ).length && !target.closest( buttons ).length ) {
					save( ev );
				}
			}
			
			/**
			 * Makes element editable
			 */
			function startEditing() {
                buttons.children().show();
                editEl.hide();
	            editable.attr('contentEditable', true).focus();
				options.saveOnBlur && $('body').bind( 'click', saveOnClickOutside );
			}
			/**
			 * Makes element non-editable
			 */
			function stopEditing() {
				buttons.children().hide();
				editEl.show().focus();
                editable.attr('contentEditable', false);
				options.saveOnBlur && $('body').unbind( 'click', saveOnClickOutside );
			}
        });
    };
	
	$.fn.editableText.defaults = {
		/**
		 * Allow markdown if possible. If enabled, editables that have the attribute 'data-markdown'
		 * will be treated as markdown (requires showdown.js to be loaded).
		 */
		allowMarkdown: true,
		/**
		 * Pass true to enable line breaks. Useful with divs that contain paragraphs.
		 * If false, prevents user from adding newlines to headers, links, etc.
		 */
		newlinesEnabled : false,
		/**
		 * Event that is triggered when editable text is changed.
		 * Passes the new element value as the first parameter.
		 */
		changeEvent : 'change',
		/**
		 * Adjust the top margin for the buttons to the margin on the editable element.
		 * Useful for headings, etc.
		 */
		compensateTopMargin: true,
		/**
		 * Titles for the 'edit', 'save' and 'cancel' buttons
		 */
		editTitle: 'Edit',
		saveTitle: 'Save',
		cancelTitle: 'Discard',
		/**
		 * Whether or not 'dblclick' should trigger 'edit'.
		 */
		editOnDblClick: true,
		/**
		 * Whether or not 'blur' (focusing away from the editable, and the buttons) should trigger 'save'.
		 */
		saveOnBlur: true,
		showCancel: true
	};
})( jQuery );