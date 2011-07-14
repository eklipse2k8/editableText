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
(function( $, undefined ){		
	/**
	 * Usage $('selector).editableText( options );
	 * See $.fn.editableText.defaults for valid options 
	 */
    $.fn.editableText = function( options ) {
		options = $.extend({}, $.fn.editableText.defaults, options);
		
        return this.each( function() {
			// Add jQuery methods to the element
			var editable = $( this );
			var markdown = options.allowMarkdown && window.Showdown && editable.data('markdown') != null;
			
			// 'Edit' action
			var edit = function( ev ) {
				ev.preventDefault();
				startEditing();
				markdown && editable.html( value );
			};
			
			// 'Save' action
			var save = function( ev ) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
				stopEditing();
				var prevValue = value;
				value = editable.html();
				setContent( value );
				
				// Strip trailing '<br>' from 'value'; seems to occur (at least in FF) when typing <space>,
				// then <enter> (even when cancelling the keydown event).
				if ( !options.newlinesEnabled && value.match( /<br>$/ ) ) {
					value = value.substr( 0, value.length - 4 );
				}
				
				$.isFunction( options.change ) && options.change.call( editable[0], value, prevValue );
				editable.trigger( options.changeEvent, [ value, prevValue ] );
			};
			
			// 'Cancel' action
			var cancel = function( ev ) {
				ev.preventDefault();
				ev.stopImmediatePropagation();
				stopEditing();
				setContent( value );
			};
			
			var setContent = function( content ) {
				// When using 'markdown', replace all <br> by \n.
				if ( markdown ) {
					editable.html( converter.makeHtml( content.replace(/<br>/gi, '\n') ) );
				}
				else {
					editable.html( content );
				}
			};
			
			/**
			 * 'value' is saved in 'startEditing', so we can restore the original content if editing is cancelled.
			 */
			var value = editable.html();
			
			if ( markdown ) {
				var converter = new Showdown.converter();
				setContent( value );
			}
			
			// Create edit/save buttons
			var buttons;
			if ( options.showToolbar ) {
				buttons = $(
					"<div class='editableToolbar'>" +
						( options.showEdit ? "<a href='#' class='edit' title='" + options.editTitle + "'></a>" : '' ) +
						( options.showSave ? "<a href='#' class='save' title='" + options.saveTitle + "'></a>" : '' ) +
						( options.showCancel ? "<a href='#' class='cancel' title='" + options.cancelTitle + "'></a>" : '' ) +
					"</div>")
					.insertBefore( editable )
					.css( { 'zIndex': ( parseInt( editable.css('zIndex'), 10 ) || 0 ) + 1 } )
				
				options.compensateTopMargin && buttons.css( { 'margin-top': editable.css('margin-top') } );
				
				// Save references and attach events
				var editEl = buttons.find('.edit').click( edit );
				buttons.find('.save').click( save );
				buttons.find('.cancel').click( cancel );
				
				// Display only the 'edit' button by default
				buttons.children().hide();
				editEl.show();
			}
			
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
			
			options.editOnDblClick && editable.dblclick( function() {
					if ( editable.attr('contentEditable') !== 'true' ) {
						edit.apply( this, arguments );
					}
				});
			
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
				if ( options.showToolbar ) {
					buttons.children().show();
					editEl.hide();
				}
				
				editable.attr('contentEditable', true).focus();
				options.saveOnBlur && $( document ).bind( 'click', saveOnClickOutside );
				
				// Trigger callback/event
				$.isFunction( options.startEditing ) && options.startEditing.call( editable[0] );
				editable.trigger( 'startEditing' );
			}
			
			/**
			 * Makes element non-editable
			 */
			function stopEditing() {
				if ( options.showToolbar ) {
					buttons.children().hide();
					editEl.show();
				}
				
				editable.attr('contentEditable', false);
				options.saveOnBlur && $( document ).unbind( 'click', saveOnClickOutside );
				editable.blur();
				
				// Trigger callback/event
				$.isFunction( options.stopEditing ) && options.stopEditing.call( editable[0] );
				editable.trigger( 'stopEditing' );
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
		 * Show options the toolbar (and it's individual buttons)
		 */
		showToolbar: true,
		showCancel: true,
		showEdit: true,
		showSave: true,
		/**
		 * Adjust the top margin for the 'editableToolbar' to the margin on the editable element.
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
		/**
		 * Callbacks
		 */
		change: null,
		startEditing: null,
		stopEditing: null
	};
})( jQuery );