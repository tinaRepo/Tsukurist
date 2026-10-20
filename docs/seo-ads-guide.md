# SEO・広告ガイド

## SEO

- 本番の正規URLは `https://tsukurist.com` です。サイトURLの定義は `lib/site.ts` の `SITE_URL` にあり、`lib/seo.ts` から再エクスポートされています。
- 共通metadataは `app/layout.tsx`、ページ固有のmetadataは各公開ページで設定します。
- トップページ `/` は未ログイン時にサービス紹介を表示し、ログインCookieがある場合はアプリを表示して `noindex` にします。旧URL `/lp` は `/` へ恒久転送します。ログイン後のアプリ、デモ、管理、課金画面は検索対象にしません。
- 公開対象のURLだけを `app/sitemap.ts` に登録し、`public/robots.txt` のサイトマップURLと合わせます。検索対象外の画面は `noindex` metadataで指定します。robots.txtでクロール自体を拒否すると検索エンジンがnoindexを確認できないため、通常はDisallowしません。`robots.txt` は静的ファイルのため、Preview環境を自動的に全面Disallowする仕組みではありません。
- URLや公開ページを変更した場合はmetadata、canonical、サイトマップ、robots.txtをまとめて確認します。
- Google Search Consoleには実サイトURLのURLプレフィックスを登録し、所有権を確認して `/sitemap.xml` を送信します。
- 検索結果からの削除・新規登録を反映するには時間がかかることがあります。Search ConsoleのURL検査でGoogleが取得したHTMLとcanonicalを確認し、必要に応じてインデックス登録をリクエストします。

## Google AdSense

- 広告スクリプトは公開コンテンツページだけに読み込みます。対象ページと読み込み制御は `components/AdSenseLoader.tsx` の `AD_ALLOWED_PATHS` が基準です。
- 所有確認用metaは広告スクリプトとは別に設定します。広告を出すページを追加するときは、コンテンツとAdSenseポリシーを確認してから対象に含めます。
- publisher IDを変更する場合は、コードと `public/ads.txt` の認定販売者レコードを合わせます。
- デプロイ後、Search ConsoleのURL検査、AdSenseの所有・配信状況、`/ads.txt` のHTTP 200を確認します。
- Vercel Previewは本番とは別のホスト名です。広告をPreviewで読み込ませたくない場合はPreview URLでの表示を検証し、広告スクリプトの読み込み条件を実装に合わせて管理してください。

広告タグやmetadataの変更後は、ブラウザーでhead出力、コンソール、広告の表示を確認してください。
