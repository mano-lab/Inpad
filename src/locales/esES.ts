export default {
  translation: {
    //General
    'general.error': 'Error',
    'general.cancel': 'Cancelar',
    'general.attachments': 'Archivos adjuntos',
    'general.trash': 'Basura',
    'general.allnote': 'Todas las notas',
    'general.signin': 'Iniciar sesión',
    'general.signOut': 'Cerrar sesión',
    'general.save': 'Guardar',
    'general.default': 'Por defecto',
    'general.networkError': 'Error de conexión',

    // Storage
    'storage.name': 'Nombre del almacenamiento',
    'storage.noStorage': 'NO hay almacenamiento',
    'storage.create': 'Crear almacenamiento',
    'storage.edit': 'Editar almacenamiento',
    'storage.rename': 'Cambiar el nombre del almacenamiento',
    'storage.renameMessage': 'Introduce el nuevo nombre para el almacenamiento',
    'storage.remove': 'Eliminar almacenamiento',
    'storage.removeMessage':
      'Este almacenamiento se va a desvincular de esta aplicación.',
    'storage.delete': 'Eliminar almacenamiento',
    'storage.move': 'Mover nota',
    'storage.moveTitle': 'Mover nota a otro almacenamiento',
    'storage.moveMessage':
      'Estas intentando mover una nota a otro almacenamiento.',
    'storage.copy': 'Copiar nota',
    'storage.typeLocal': 'Local',
    'storage.typeCloud': 'Almacenamiento online',
    'storage.needSignIn':
      'Necesitas iniciar sesión para usar el almacenamiento en la nube.',
    'storage.syncDate': 'Última sincronización a las',

    //Folder
    'folder.create': 'Nueva carpeta',
    'folder.rename': 'Renombrar la carpeta',
    'folder.renameMessage':
      'Introduce el nuevo nombre para la carpeta, cada nota y subcarpeta también se vera afectada.',
    'folder.renameErrorMessage': 'No puede renombrar esta carpeta',
    'folder.changeColor': 'Cambiar el color',
    'folder.changeColorMessage': 'Selecciona un color para su carpeta',
    'folder.remove': 'Eliminar carpeta',
    'folder.removeMessage':
      'Todas las notas y subcarpetas van a ser eliminadas.',

    //Tag
    'tag.tag': 'Etiqueta',
    'tag.remove': 'Eliminar etiqueta',
    'tag.removeMessage': 'Vas a quitar esta etiqueta de todas las notas.',

    //Note
    'note.duplicate': 'Duplicada',
    'note.delete': 'Eliminar',
    'note.delete2': 'Eliminar una nota',
    'note.deleteMessage': 'Esta nota se va a eliminar permanentemente',
    'note.empty': 'Nota vacia',
    'note.unselect': 'Ninguna nota esta seleccionada',
    'note.search': 'Buscar notas',
    'note.nothing': 'Ninguna nota',
    'note.nothingMessage': 'No se han encontrado notas.',
    'note.noTitle': 'No hay título',
    'note.date': 'Hace',
    'note.createKeyMac': 'Mac: Command(⌘) + n',
    'note.createKeyWinLin': 'Windows/Linux: Ctrl + n',
    'note.createkeymessage1': 'Para crear una nueva nota',
    'note.createkeymessage2': 'Selecciona un lugar de almacenamiento',
    'note.createkeymessage3': 'Para crear una nota',
    'note.restore': 'Restaurar',

    //Bookmark
    'bookmark.remove': 'Eliminar marcador',
    'bookmark.add': 'Marcador',

    //About
    'about.about': 'Sobre nosotros',
    'about.boostnoteDescription':
      'Un aplicación para tomar notas creadas por programadores como tú.',
    'about.website': 'Sitio oficial',
    'about.boostWiki': 'Boost Note para equipos',
    'about.platform': 'Multi plataforma',
    'about.community': 'Comunidad',
    'about.github': 'Repositorio en Github',
    'about.bounty': 'Recompensas en IssueHunt',
    'about.blog': 'Blog',
    'about.slack': 'Grupo de Slack',
    'about.twitter': 'Cuenta de Twitter',
    'about.facebook': 'Grupo de Facebook',
    'about.reddit': 'Reddit',

    //Billing
    'billing.billing': 'Pago',
    'billing.message': 'Inicia sesión para cambiar el plan actual.',
    'billing.basic': 'Básico',
    'billing.current': 'Actual',
    'billing.premium': 'Premium',
    'billing.price': '$3/Mes (USD) *',
    'billing.browser': 'Aplicación web',
    'billing.desktop': 'Aplicación para escritorio(Mac/Windows/Linux)',
    'billing.mobile': 'Aplicación para móvil(iOS/Android)',
    'billing.sync': 'Sincronizar múltiples dispositivos',
    'billing.local': 'Almacenamiento local',
    'billing.cloud': 'Almacenamiento en la nube',
    'billing.storageSize': 'Tamaño del almacenamiento en la nube',
    'billing.addStorageDescription':
      '* Si necesitas más almacenamiento en la nube, puedes ampliarlo en cualquier momento por $5 (USD) cada 5GB.Pincha en el botón "Ampliar almacenamiento" justo debajo.',
    'billing.addStorage': 'Añadir almacenamiento extra',

    // Preferences
    'preferences.general': 'Preferencias',

    // Preferences GeneralTab
    'preferences.account': 'Cuenta',
    'preferences.addAccount': 'Iniciar sesión',
    'preferences.loginWorking': 'Iniciando sesión...',
    'preferences.interfaceLanguage': 'Idioma para la interfaz',
    'preferences.applicationTheme': 'Tema para la aplicación',
    'preferences.auto': 'Automático',
    'preferences.light': 'Luminoso',
    'preferences.dark': 'Oscuro',
    'preferences.sepia': 'Sepia',
    'preferences.solarizedDark': 'Solarized oscuro',
    'preferences.noteSorting': 'Ordenar notas',
    'preferences.dateUpdated': 'Fecha actualizada',
    'preferences.dateCreated': 'Fecha creada',
    'preferences.title': 'Títulos',
    'preferences.analytics': 'Analíticas',
    'preferences.analyticsDescription1':
      'Boost Note recoge datos anónimamente únicamente para mejor la ampliación, y no recoge ninguna posible información personal dentro de las notas. Todo está en Github y puedes ver como funciona.',
    'preferences.analyticsDescription2':
      'Puedes activar o desactivar esta opción.',
    'preferences.analyticsLabel':
      'Habilita las analíticas para mejorar Boostnote',
    'preferences.displayTutorialsLabel': 'Tutorial y Preguntas comunes',

    // Preferences EditorTab
    'preferences.editorTheme': 'Tema del editor',
    'preferences.editorFontSize': 'Tamaño de letra del editor',
    'preferences.editorFontFamily': 'Fuente del editor',
    'preferences.editorIndentType': 'Espaciado del editor',
    'preferences.tab': 'Pestaña',
    'preferences.spaces': 'Espacios',
    'preferences.editorIndentSize': 'Tamaño de espaciado del editor',
    'preferences.editorKeymap': 'Distribución del teclado para el editor',
    'preferences.editorPreview': 'Vista previa del Editor',

    // Preferences MarkdownTab
    'preferences.previewStyle': 'Vista previa del estilo',
    'preferences.markdownCodeBlockTheme': 'Tema para el bloque de código',
    'preferences.defaultTheme': 'Usar tema por defecto',
    'preferences.markdownPreview': 'Vista previa del Markdown',

    // Preferences ImportTab
    'preferences.import': 'Importar',
    'preferences.description':
      'Importar .archivos cson desde la versión antigua de Boostnote.',
    'preferences.importFlow1':
      '1. Abre la  antigua carpeta de Boostnote donde se almacenaban los archivos en tu ordenador.',
    'preferences.importFlow2':
      '2. Arrastra y suelta los archivos .cson en la forma abajo.',
    'preferences.importFlow3':
      '3. Selecciona el almacenamiento y la carpeta para importar el almacenamiento',
    'preferences.importFlow4': '4. Cargar!',
    'preferences.importRemove': 'Eliminar',
    'preferences.importUpload': 'Subir',
  },
}
