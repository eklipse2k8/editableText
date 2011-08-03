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
	
	$.editableText = function() { return this.init.apply( this, arguments ); };
	
	$.editableText.prototype = {
		// Properties
		element: null,
		options: null,
		
		buttons: null,
		editButton: null,
		value: null,
		converter: null,
		useMarkdown: null,
		
		init: function( element, options ) {
			var dit = this;
			this.element = $( element );
			this.options = options;
			this.useMarkdown = options.enableMarkdown && window.Showdown && this.element.data('markdown') != null;
			
			this.edit = $.proxy( this.edit, this );
			this.save = $.proxy( this.save, this );
			this.cancel = $.proxy( this.cancel, this );
			
			//console.debug( 'element=%o, options=%o', this.element, this.options );
			
			// 'this.value' is saved in 'startEditing', so we can restore the original content if editing is cancelled.
			this.value = this.element.html();
			
			if ( this.useMarkdown ) {
				this.converter = new Showdown.converter();
				this._setContent( this.value );
			}
			
			// Create edit/save buttons
			this.buttons;
			if ( options.showToolbar ) {
				this.buttons = $(
					"<div class='editableToolbar'>" +
						( options.showEdit ? "<a href='#' class='edit' title='" + options.editTitle + "'></a>" : '' ) +
						( options.showSave ? "<a href='#' class='save' title='" + options.saveTitle + "'></a>" : '' ) +
						( options.showCancel ? "<a href='#' class='cancel' title='" + options.cancelTitle + "'></a>" : '' ) +
					"</div>")
					.insertBefore( this.element )
					.css( { 'zIndex': ( parseInt( this.element.css('zIndex'), 10 ) || 0 ) + 1 } )
				
				options.compensateTopMargin && this.buttons.css( { 'margin-top': this.element.css('margin-top') } );
				
				// Hide buttons; display only the 'edit' button by default
				this.buttons.children().hide();
				
				// Save references and attach events
				this.editButton = this.buttons.find('.edit').click( this.edit ).show();
				this.buttons.find('.save').click( this.save );
				this.buttons.find('.cancel').click( this.cancel );
			}
			
			// Bind on 'keydown' so we'll be first to handle keypresses, hopefully;
			// for example, jQuery.ui.dialog closes the dialog on keydown for escape.
			this.element.keydown( function( ev ) {
				// Save on enter, if not allowed to add newlines
				if ( ev.keyCode === 13 && !options.newlinesEnabled ) {
					dit.save( ev );
				}
				// Cancel on escape
				if ( ev.keyCode === 27 ) {
					dit.cancel( ev );
				}
			});
			
			options.editOnDblClick && this.element.dblclick( this.edit );
			
			// Add the contenteditable attribute to element
			if ( this.element.attr( 'contenteditable' ) == null ) {
				this.element.attr( 'contenteditable', 'false' );
			}
		},
		
		/**
		 * 'Edit' action
		 */
		edit: function( ev ) {
			if ( this.element.attr( 'contenteditable' ) === 'true' ) {
				return;
			}
			
			ev && ev.preventDefault();
			this._startEditing();
			this.useMarkdown && this.element.html( this.value );
		},
		
		/**
		 * 'Save' action
		 */
		save: function( ev ) {
			if ( this.element.attr( 'contenteditable' ) !== 'true' ) {
				return;
			}
			
			ev && ev.preventDefault();
			ev && ev.stopImmediatePropagation();
			this._stopEditing();
			var prevValue = this.value;
			this.value = this.element.html();
			this._setContent( this.value );
			
			// Strip trailing '<br>' from 'value'; seems to occur (at least in FF) when typing <space>,
			// then <enter> (even when cancelling the keydown event).
			if ( !this.options.newlinesEnabled && this.value.match( /<br>$/ ) ) {
				this.value = this.value.substr( 0, this.value.length - 4 );
			}
			
			$.isFunction( this.options.change ) && this.options.change.call( this.element[0], this.value, prevValue );
			this.element.trigger( 'change', [ this.value, prevValue ] );
		},
		
		/**
		 * 'Cancel' action
		 */
		cancel: function( ev ) {
			if ( this.element.attr( 'contenteditable' ) !== 'true' ) {
				return;
			}
			
			ev && ev.preventDefault();
			ev && ev.stopImmediatePropagation();
			this._stopEditing();
			this._setContent( this.value );
		},
		
		/**
		 * Makes element editable
		 */
		_startEditing: function() {
			if ( this.options.showToolbar ) {
				this.buttons.children().show();
				this.editButton.hide();
			}
			
			this.element.attr( 'contenteditable', 'true' ).focus();
			this.options.saveOnBlur && $( document ).bind( 'click', $.proxy( this._saveOnClickOutside, this ) );
			
			// Trigger callback/event
			$.isFunction( this.options.startEditing ) && this.options.startEditing.call( this.element[0] );
			this.element.trigger( 'startEditing' );
		},
		
		/**
		 * Makes element non-editable
		 */
		_stopEditing: function() {
			if ( this.options.showToolbar ) {
				this.buttons.children().hide();
				this.editButton.show();
			}
			
			this.element.attr( 'contenteditable', 'false' );
			this.options.saveOnBlur && $( document ).unbind( 'click', this.saveOnClickOutside );
			this.element.blur();
			
			// Trigger callback/event
			$.isFunction( this.options.stopEditing ) && this.options.stopEditing.call( this.element[0] );
			this.element.trigger( 'stopEditing' );
		},
		
		_setContent: function( content ) {
			// When 'useMarkdown', replace all <br> by \n.
			if ( this.useMarkdown ) {
				this.element.html( this.converter.makeHtml( content.replace( /<br>/gi, '\n' ) ) );
			}
			else {
				this.element.html( content );
			}
		},
		
		/**
		 * Trigger the 'save' function when the user clicks outside of both the 'editable', and outside of the 'buttons'.
		 */
		_saveOnClickOutside: function( ev ) {
			var target = $( ev.target );
			if ( !target.closest( this.element ).length && !target.closest( this.buttons ).length ) {
				this.save( ev );
			}
		}
	};
	
	/**
	 * Usage $('selector).editableText( options );
	 * See $.fn.editableText.defaults for valid options 
	 */
    $.fn.editableText = function( options ) {
		var args = Array.prototype.slice.call( arguments, 1 );
		
		return this.each( function() {
			var instance = $.data( this, '$.editableText' );
			
			// constructor
			if ( !instance ) {
				options = $.extend( {}, $.fn.editableText.defaults, options );
				$.data( this, '$.editableText', new $.editableText( this, options ) );
			}
			// regular method
			else if ( typeof options === 'string' && options[0] !== '_' && $.isFunction( instance[ options ] ) ) {
				instance[ options ].apply( instance, args );
			}
			else {
				console && console.warn('$.editableText "%o" does not have a (public) method "%o".', instance, options );
				throw new Error('$.editableText "' + instance + '" does not have a (public) method "' + options + '".' );
			}
		});
    };
	
	$.fn.editableText.defaults = {
		/**
		 * Enable markdown if possible. If enabled, editables that have the attribute 'data-markdown'
		 * will be treated as markdown (requires showdown.js to be loaded).
		 */
		enableMarkdown: true,
		/**
		 * Pass true to enable line breaks. Useful with divs that contain paragraphs.
		 * If false, prevents user from adding newlines to headers, links, etc.
		 */
		newlinesEnabled : false,
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
		 * Callbacks. Fired when the value of the editable is changed, when editing is started, or when editing is stopped.
		 */
		change: null,
		startEditing: null,
		stopEditing: null
	};
})( jQuery );