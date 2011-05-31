# jQuery.editableText

Text editing using the `contentEditable` html5 attribute.

* Start editing by clicking the 'edit' button or double-clicking the element (if the `editOnDblClick` option is enabled).
* Save by clicking the 'save' button, hitting enter (when not using the `newlinesEnabled` option; in that case, enter adds a linebreak), or focusing somewhere else on the page (when using the `saveOnBlur` option).
* Cancel by clicking the 'cancel' button (when shown; use the `showCancel` option to hide the cancel button), or hitting the escape key.

On save, a `change` event is fired, with the new value of the edited element as it's first argument.