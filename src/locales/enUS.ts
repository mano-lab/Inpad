export default {
  translation: {
    //General
    'general.error': 'Error',
    'general.cancel': 'Cancel',
    'general.attachments': 'Attachments',
    'general.trash': 'Trash',
    'general.allnote': 'All Notes',
    'general.signin': 'Sign In',
    'general.signOut': 'Sign Out',
    'general.save': 'Save',
    'general.default': 'Default',
    'general.networkError': 'Network Error',

    // Storage
    'storage.name': 'Storage Name',
    'storage.noStorage': 'No storages',
    'storage.create': 'Create Storage',
    'storage.edit': 'Edit Storage',
    'storage.rename': 'Rename Storage',
    'storage.renameMessage': 'Enter new storage name',
    'storage.remove': 'Remove Storage',
    'storage.removeMessage':
      'Warning! This will permanently remove all notes locally stored on this location.',
    'storage.delete': 'Delete {{storage}} storage',
    'storage.move': 'Move Note',
    'storage.moveTitle': 'Move Note to Other storage',
    'storage.moveMessage':
      'You are trying to move a note to different storage.',
    'storage.copy': 'Copy Note',
    'storage.typeLocal': 'Local',
    'storage.typeCloud': 'Cloud',
    'storage.needSignIn': 'You need to sign in to create a cloud storage.',
    'storage.syncDate': 'Last synced at',

    //Folder
    'folder.create': 'New Folder',
    'folder.rename': 'Rename Folder',
    'folder.renameMessage':
      'Enter the new folder name, every note and subfolder paths will also be updated.',
    'folder.renameErrorMessage': 'You could not rename the folder',
    'folder.remove': 'Remove Folder',
    'folder.removeMessage': 'All notes and subfolders will be deleted.',

    //Tag
    'tag.tag': 'Tags',
    'tag.remove': 'Remove Tag',
    'tag.removeMessage': 'The tag will be untagged from all notes.',

    //Note
    'note.duplicate': 'Duplicate',
    'note.delete': 'Delete',
    'note.delete2': 'Delete a Note',
    'note.deleteMessage': 'The note will be deleted permanently',
    'note.empty': 'Empty note',
    'note.unselect': 'No note is selected',
    'note.search': 'Search Notes',
    'note.nothing': 'No notes',
    'note.nothingMessage': 'No notes could be found.',
    'note.noTitle': 'No title',
    'note.date': 'ago',
    'note.createKeyOr': 'or',
    'note.createKey': 'N',
    'note.createKeyMac': 'on Mac',
    'note.createKeyWinLin': 'on Windows/Linux',
    'note.createkeymessage1': 'To create a new note, press',
    'note.createkeymessage2': 'Select a storage',
    'note.createkeymessage3': 'to create a new note',
    'note.restore': 'Restore',

    //Bookmark
    'bookmark.remove': 'Remove Bookmark',
    'bookmark.add': 'Bookmark',

    //About
    'about.about': 'About',
    'about.boostnoteDescription':
      'An open source note-taking app made for programmers just like you.',
    'about.website': 'Official Website',
    'about.boostWiki': 'Boost Note for Team',
    'about.platform': 'Cross-platform',
    'about.community': 'Community',
    'about.github': 'GitHub Repository',
    'about.bounty': 'Bounty on IssueHunt',
    'about.blog': 'Blog',
    'about.slack': 'Slack Group',
    'about.twitter': 'Twitter Account',
    'about.facebook': 'Facebook Group',
    'about.reddit': 'Reddit',

    //Billing
    'billing.billing': 'Billing',
    'billing.message': 'Please sign in to upgrade your plan.',
    'billing.basic': 'Basic',
    'billing.current': 'Current',
    'billing.premium': 'Premium',
    'billing.price': '$3/Month (USD) *',
    'billing.browser': 'Browser App',
    'billing.desktop': 'Desktop App (Mac/Windows/Linux)',
    'billing.mobile': 'Mobile App (iOS/Android)',
    'billing.sync': 'Syncing Multiple Devices',
    'billing.local': 'Local Storage',
    'billing.cloud': 'Cloud Storage',
    'billing.storageSize': 'Cloud Storage Size',
    'billing.addStorageDescription':
      '* If you need more cloud storage, you can add it at any time by paying $5 (USD) for every 5GB. Click the "Add Extra Storage" button below.',
    'billing.addStorage': 'Add Extra Storage',

    // Preferences
    'preferences.general': 'Preferences',

    // Preferences GeneralTab
    'preferences.account': 'Account',
    'preferences.addAccount': 'Sign in',
    'preferences.loginWorking': 'Loggin in...',
    'preferences.interfaceLanguage': 'Interface Language',
    'preferences.applicationTheme': 'Application Theme',
    'preferences.auto': 'Auto',
    'preferences.light': 'Light',
    'preferences.dark': 'Dark',
    'preferences.sepia': 'Sepia',
    'preferences.solarizedDark': 'Solarized Dark',
    'preferences.noteSorting': 'Note Sorting',
    'preferences.dateUpdated': 'Date Updated',
    'preferences.dateCreated': 'Date Created',
    'preferences.title': 'Title',
    'preferences.analytics': 'Analytics',
    'preferences.analyticsDescription1':
      'Boost Note collects anonymous data for the sole purpose of improving the application, and strictly does not collect any personal information such the contents of your notes.You can see how it works on GitHub.',
    'preferences.analyticsDescription2':
      'You can choose to enable or disable this option.',
    'preferences.analyticsLabel': 'Enable analytics to help improve Boostnote',
    'preferences.displayTutorialsLabel': 'Tutorials and FAQ',

    // Preferences EditorTab
    'preferences.editorTheme': 'Editor Theme',
    'preferences.editorFontSize': 'Editor Font Size',
    'preferences.editorFontFamily': 'Editor Font Family',
    'preferences.editorIndentType': 'Editor Indent Type',
    'preferences.tab': 'Tab',
    'preferences.spaces': 'Spaces',
    'preferences.editorIndentSize': 'Editor Indent Size',
    'preferences.editorKeymap': 'Editor Keymap',
    'preferences.editorPreview': 'Editor Preview',

    // Preferences MarkdownTab
    'preferences.previewStyle': 'Preview Style',
    'preferences.markdownCodeBlockTheme': 'Code Block Theme',
    'preferences.defaultTheme': 'Use default style',
    'preferences.markdownPreview': 'Markdown Preview',

    // Preferences ImportTab
    'preferences.import': 'Import',
    'preferences.description': 'Import .cson files from old Boostnote.',
    'preferences.importFlow1': '1. Open old Boostnote folder in your PC.',
    'preferences.importFlow2':
      '2. Drag and drop .cson files to the form below.',
    'preferences.importFlow3':
      '3. Choose the Storage and Folder that you want to move your old data.',
    'preferences.importFlow4': '4. Upload!',
    'preferences.importRemove': 'remove',
    'preferences.importUpload': 'Upload',

    //Preferences KeyBindings
    'preferences.toggleBoostNote': 'Show/Hide BoostNote',
    'preferences.toggleMenu': 'Show/Hide Menu',
    'preferences.toggleEditMode': 'Toggle Editor Mode',
    'preferences.toggleDirection': 'Toggle Direction',
    'preferences.deleteNote': 'Delete Note',
    'preferences.pasteHTML': 'Paste HTML',
    'preferences.prettifyMarkdown': 'Prettify Markdown',
    'preferences.insertCurrentDate': 'Insert Current Date',
    'preferences.insertCurrentDateTime': 'Insert Current Date/Time',
    'preferences.nextNote': 'Switch to Next Note',
    'preferences.previousNote': 'Switch to Previous Note',
    'preferences.keybindingSaveError': 'An error occured. Shortcuts cannot end in a modifier except single key shortcuts CONTROL and ALT'
  },
}
