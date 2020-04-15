export default {
  translation: {
    //General
    'general.error': 'エラー',
    'general.cancel': 'キャンセル',
    'general.attachments': '画像',
    'general.trash': 'ゴミ箱',
    'general.allnote': '全てのノート',
    'general.signin': 'サインイン',
    'general.signOut': 'サインアウト',
    'general.save': '保存',
    'general.default': 'デフォルト',
    'general.networkError': 'ネットワークエラー',

    // Storage
    'storage.name': 'ストレージ名',
    'storage.noStorage': 'ストレージがありません',
    'storage.create': 'ストレージ作成',
    'storage.edit': 'ストレージを編集する',
    'storage.rename': 'ストレージ名を変える',
    'storage.renameMessage': '新しいストレージ名を入力する',
    'storage.remove': 'ストレージを除去する',
    'storage.removeMessage': 'このストレージはアプリから除外されます',
    'storage.delete': 'ストレージを削除する',
    'storage.move': 'ストレージを移動する',
    'storage.moveTitle': 'ノートを新しいストレージに移動する',
    'storage.moveMessage': 'ノートを別のストレージに移動させています',
    'storage.copy': 'ノートをコピーする',
    'storage.typeLocal': 'ローカル',
    'storage.typeCloud': 'クラウド',
    'storage.needSignIn':
      'クラウドストレージを作るためにはサインインが必要です',
    'storage.syncDate': '最終更新',

    //Folder
    'folder.create': 'フォルダ作成',
    'folder.rename': 'フォルダ名変更',
    'folder.renameMessage':
      'フォルダ名を変えると、全てのノートやサブフォルダのパスも更新されます',
    'folder.renameErrorMessage': 'フォルダ名を変更できません',
    'folder.changeColor': '色を変える',
    'folder.changeColorMessage': 'フォルダの色を選択します',
    'folder.remove': 'フォルダを削除する',
    'folder.removeMessage': 'フォルダを削除すると全てのノートも削除されます',

    //Tag
    'tag.tag': 'タグ',
    'tag.remove': 'タグを削除する',
    'tag.removeMessage': '全てのノートからタグが削除されます',

    //Note
    'note.duplicate': 'コピー',
    'note.delete': '削除',
    'note.delete2': 'ノートを削除する',
    'note.deleteMessage': 'このノートは永久に削除されます',
    'note.empty': 'ノートがありません',
    'note.unselect': 'ノートが選択されていません',
    'note.search': '検索',
    'note.nothing': 'ノートがありません',
    'note.nothingMessage': 'ノートが見つかりません',
    'note.noTitle': '無題',
    'note.date': '前',
    'note.createKeyMac': 'Mac: Command(⌘) + n',
    'note.createKeyWinLin': 'Windows/Linux: Ctrl + n',
    'note.createkeymessage1': 'ノート作成',
    'note.createkeymessage2': 'ストレージを選択しましょう',
    'note.createkeymessage3': 'ノート作成',
    'note.restore': '復元',

    //Bookmark
    'bookmark.remove': 'ブックマークを削除する',
    'bookmark.add': 'ブックマーク',

    //About
    'about.about': '概要',
    'about.boostnoteDescription': 'オープンソースの開発者のためのノートアプリ',
    'about.website': 'ウェブサイト',
    'about.boostWiki': 'チームのためのBoost Note',
    'about.platform': 'クロスプラットフォーム',
    'about.community': 'コミュニティ',
    'about.github': 'GitHubレポジトリ',
    'about.bounty': '報奨金プログラム',
    'about.blog': 'ブログ',
    'about.slack': 'スラックグループ',
    'about.twitter': 'ツイッター',
    'about.facebook': 'フェイスブックグループ',
    'about.reddit': 'レディット',

    //Billing
    'billing.billing': '課金',
    'billing.message':
      'プランをアップグレードするためにはサインインしてください',
    'billing.basic': '無料',
    'billing.current': '今のプラン',
    'billing.premium': 'プレミアム',
    'billing.price': '3ドル/月 *',
    'billing.browser': 'ブラウザ',
    'billing.desktop': 'デスクトップアプリ (Mac/Windows/Linux)',
    'billing.mobile': 'モバイルアプリ (iOS/Android)',
    'billing.sync': '複数デバイス間でデータ同期',
    'billing.local': 'ローカルストレージ',
    'billing.cloud': 'クラウドストレージ',
    'billing.storageSize': 'クラウドストレージ容量',
    'billing.addStorageDescription':
      '* クラウドストレージ容量を増やすためには、月5ドルを払うことで5GB追加することができます。下の「ストレージ追加」ボタンを押して追加購入をお願いいたします。',
    'billing.addStorage': '容量を増やす',

    // Preferences
    'preferences.general': '設定',

    // Preferences GeneralTab
    'preferences.account': 'アカウント',
    'preferences.addAccount': 'ログイン',
    'preferences.loginWorking': 'ログイン中...',
    'preferences.interfaceLanguage': 'インタフェース言語',
    'preferences.applicationTheme': 'アプリケーションテーマ',
    'preferences.auto': '自動',
    'preferences.light': 'ライト',
    'preferences.dark': 'ダーク',
    'preferences.sepia': 'セピア',
    'preferences.solarizedDark': 'ソラライズドダーク',
    'preferences.noteSorting': 'ノート整列',
    'preferences.dateUpdated': 'アップデート順',
    'preferences.dateCreated': '生成順',
    'preferences.title': 'タイトル順',
    'preferences.analytics': 'アナリティクス',
    'preferences.analyticsDescription1':
      'Boost Noteは、改善のためにエンドポイント数等のみデータを取得しています。あなたのノートの中身を見たり、データを取得することは絶対にありません。Boost Noteはオープンソースであるため、どのように動いているかGitHubから確認することができます。',
    'preferences.analyticsDescription2':
      'データ取得をオンにするかオフにするか、選ぶことができます。',
    'preferences.analyticsLabel':
      'Boost Noteの改善のために、データ取得をオンにする',
    'preferences.displayTutorialsLabel': 'チュートリアルを表示',

    // Preferences EditorTab
    'preferences.editorTheme': 'エディターテーマ',
    'preferences.editorFontSize': 'エディターフォントサイズ',
    'preferences.editorFontFamily': 'エディターフォントファミリー',
    'preferences.editorIndentType': 'エディターインデントタイプ',
    'preferences.tab': 'タブ',
    'preferences.spaces': 'スペース',
    'preferences.editorIndentSize': 'エディターインデントサイズ',
    'preferences.editorKeymap': 'エディターキーマップ',
    'preferences.editorPreview': 'エディタープレヴュー',

    // Preferences MarkdownTab
    'preferences.previewStyle': 'プレビュースタイル',
    'preferences.markdownCodeBlockTheme': 'コードブロックテーマ',
    'preferences.defaultTheme': 'Use default style',
    'preferences.markdownPreview': 'Markdown Preview',

    // Preferences ImportTab
    'preferences.import': 'データ移行',
    'preferences.description': '旧Boost Noteアプリからデータを移行する',
    'preferences.importFlow1':
      '1. あなたのPCで、Boost Noteのファイルが入っているフォルダを選択します',
    'preferences.importFlow2':
      '2. .csonファイルを選択し、下のフォームにドラッグ&ドロップしてください',
    'preferences.importFlow3':
      '3. どのストレージ・フォルダにデータを移行させるか選択してください',
    'preferences.importFlow4': '4. アップロード',
    'preferences.importRemove': '削除',
    'preferences.importUpload': 'アップロード',
  },
}
