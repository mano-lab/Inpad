export default {
  translation: {
    //General
    'general.error': 'Erreur',
    'general.cancel': 'Annuler',
    'general.attachments': 'Pièces jointes',
    'general.trash': 'Corbeille',
    'general.allnote': 'Toutes les notes',
    'general.signin': 'Se connecter',
    'general.signOut': 'Se déconnecter',
    'general.save': 'Sauvegarder',
    'general.default': 'Par défaut',
    'general.networkError': 'Erreur réseau',

    // Storage
    'storage.name': "Nom de l'espace de stockage",
    'storage.noStorage': "Pas d'espace de stockage",
    'storage.create': 'Créer un espace de stockage',
    'storage.edit': "Éditer l'espace de stockage",
    'storage.rename': "Renommer l'espace de stockage",
    'storage.renameMessage': "Entrer le nouveau nom de l'espace de stockage",
    'storage.remove': "Supprimer l'espace de stockage",
    'storage.removeMessage':
      "L'espace de stockage sera dissocié de cette application.",
    'storage.delete': "Supprimer l'espace de stockage",
    'storage.move': 'Déplacer la note',
    'storage.moveTitle': 'Déplacer la note dans un autre espace de stockage',
    'storage.moveMessage':
      'Vous essayez de déplacer la note dans un autre espace de stockage.',
    'storage.copy': 'Copier la note',
    'storage.typeLocal': 'Local',
    'storage.typeCloud': 'Cloud',
    'storage.needSignIn':
      'Vous devez vous connecter pour créer un espace de stockage cloud.',
    'storage.syncDate': 'Dernière synchronisation à',

    //Folder
    'folder.create': 'Nouveau dossier',
    'folder.rename': 'Renommer dossier',
    'folder.renameMessage':
      'Entrez le nom du nouveau dossier, toutes les notes et adresses des sous-dossiers seront également mises à jour.',
    'folder.renameErrorMessage': 'Impossible de renommer le dossier',
    'folder.changeColor': 'Changer la couleur',
    'folder.changeColorMessage': 'Sélectionnez une couleur pour votre dossier',
    'folder.remove': 'Supprimer dossier',
    'folder.removeMessage':
      'Toutes les notes et sous-dossiers seront supprimés.',

    //Tag
    'tag.tag': 'Tags',
    'tag.remove': 'Supprimer Tag',
    'tag.removeMessage': 'Le tag sera retiré de toutes les notes.',

    //Note
    'note.duplicate': 'Dupliquer',
    'note.delete': 'Supprimer',
    'note.delete2': 'Supprimer une note',
    'note.deleteMessage': 'La note sera supprimée de façon permanente',
    'note.empty': 'Note vide',
    'note.unselect': "Aucune note n'est sélectionnée",
    'note.search': 'Chercher dans les notes',
    'note.nothing': 'Pas de notes',
    'note.nothingMessage': "Aucune note n'a été trouvée.",
    'note.noTitle': 'Pas de titre',
    'note.date': 'Il y a',
    'note.createKeyMac': 'Mac: Command(⌘) + n',
    'note.createKeyWinLin': 'Windows/Linux: Ctrl + n',
    'note.createkeymessage1': 'pour créer une nouvelle note',
    'note.createkeymessage2': 'Sélectionner un espace de stockage',
    'note.createkeymessage3': 'pour créer une nouvelle note',
    'note.restore': 'Restaurer',

    //Bookmark
    'bookmark.remove': 'Supprimer marque-page',
    'bookmark.add': 'Marque-page',

    //About
    'about.about': 'À propos',
    'about.boostnoteDescription':
      'Une application de prise de notes open source faite pour les développeurs comme vous.',
    'about.website': 'Site officiel',
    'about.boostWiki': 'Boostnote pour les équipes',
    'about.platform': 'Multi-plateforme',
    'about.community': 'Communauté',
    'about.github': 'Dépôt GitHub',
    'about.bounty': 'Prime sur IssueHunt',
    'about.blog': 'Blog',
    'about.slack': 'Groupe Slack',
    'about.twitter': 'Compte Twitter',
    'about.facebook': 'Groupe Facebook',
    'about.reddit': 'Reddit',

    //Billing
    'billing.billing': 'Facturation',
    'billing.message':
      'Veuillez vous connecter pour mettre à jour votre abonnement.',
    'billing.basic': 'Basique',
    'billing.current': 'Actuel',
    'billing.premium': 'Premium',
    'billing.price': '$3/Mois (USD) *',
    'billing.browser': 'Application web',
    'billing.desktop': 'Application bureau (Mac/Windows/Linux)',
    'billing.mobile': 'Application mobile (Lancement en Janvier 2020)',
    'billing.sync': 'Synchroniser plusieurs appareils',
    'billing.local': 'Stockage local',
    'billing.cloud': 'Stockage cloud',
    'billing.storageSize': "Taille de l'espace de stockage cloud",
    'billing.addStorageDescription':
      '* Si vous avez besoin de plus d\'espace de stockage cloud, vous pouvez en ajouter à toute moment en payant $5 (USD) pour chaque tranche de 5GB supplémentaire. Cliquez sur le bouton "Ajouter plus de stockage" ci-dessous.',
    'billing.addStorage': 'Ajouter plus de stockage',

    // Preferences
    'preferences.general': 'Préférences',

    // Preferences GeneralTab
    'preferences.account': 'Compte',
    'preferences.addAccount': 'Se connecter',
    'preferences.loginWorking': 'Connexion...',
    'preferences.interfaceLanguage': "Langage de l'interface",
    'preferences.applicationTheme': "Thème de l'application",
    'preferences.auto': 'Automatique',
    'preferences.light': 'Clair',
    'preferences.dark': 'Sombre',
    'preferences.sepia': 'Sepia',
    'preferences.solarizedDark': 'Sombre solarisé',
    'preferences.noteSorting': 'Trier les notes',
    'preferences.dateUpdated': 'Date de mise à jour',
    'preferences.dateCreated': 'Date de création',
    'preferences.title': 'Titre',
    'preferences.analytics': 'Analyse de données',
    'preferences.analyticsDescription1':
      "Boostnote recueille des données anonymes dans le seul but d'améliorer l'application, et ne collecte strictement aucune donnée personnelle telle que les contenus de vos notes. Vous pouvez voir comment le recueil de données fonctionne sur GitHub.",
    'preferences.analyticsDescription2':
      "Vous pouvez choisir d'activer ou de désactiver cette option.",
    'preferences.analyticsLabel':
      "Autoriser l'analyse de données pour aider à améliorer Boostnote",
    'preferences.displayTutorialsLabel': 'Tutoriels et FAQ',

    // Preferences EditorTab
    'preferences.editorTheme': "Thème de l'éditeur",
    'preferences.editorFontSize': "Taille de la police de l'éditeur",
    'preferences.editorFontFamily': "Famille de police de l'éditeur",
    'preferences.editorIndentType': "Type d'indentation de l'éditeur",
    'preferences.tab': 'Tab',
    'preferences.spaces': 'Espace',
    'preferences.editorIndentSize': "Taille d'indentation de l'éditeur",
    'preferences.editorKeymap': "Distribution des touches de l'éditeur",
    'preferences.editorPreview': "Prévisualisation de l'éditeur",

    // Preferences MarkdownTab
    'preferences.previewStyle': 'Style de la prévisualisation',
    'preferences.markdownCodeBlockTheme': 'Thème du bloc de code',
    'preferences.defaultTheme': 'Utiliser le style par défaut',
    'preferences.markdownPreview': 'Prévisualisation du markdown',

    // Preferences ImportTab
    'preferences.import': 'Importer',
    'preferences.description':
      "Importer des fichiers .cson depuis l'ancienne version de Boostnote.",
    'preferences.importFlow1':
      "1. Ouvrir le dossier de l'ancienne version de Boostnote sur votre ordinateur.",
    'preferences.importFlow2':
      '2. Cliquez et déposez les fichiers .cson dans le formulaire ci-dessous.',
    'preferences.importFlow3':
      "3. Choisissez l'espace de stockage et le dossier dans lequel vous voulez déplacer vos anciennes données.",
    'preferences.importFlow4': '4. Télécharger!',
    'preferences.importRemove': 'supprimer',
    'preferences.importUpload': 'Télécharger',
  },
}
