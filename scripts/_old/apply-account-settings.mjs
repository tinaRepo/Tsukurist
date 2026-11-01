// ユーザーメニューのUX改善 + アカウント系の別モーダル化に伴う既存ファイルの部分修正。
//   node scripts/apply-account-settings.mjs --dry-run
//   node scripts/apply-account-settings.mjs --apply
// 前提: components/AccountSettingsModal.tsx を追加済みであること（zipに同梱）。
// 置換前の文字列がちょうど1回見つからないファイルは書き込まず報告する。適用済みなら黙ってスキップ（再実行可）。
// CRLF/LFはファイルごとに判定し、元の改行を維持する。適用後はこのスクリプトを削除してよい。
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
if (!["--dry-run", "--apply"].includes(mode)) { console.error("Usage: node scripts/apply-account-settings.mjs --dry-run | --apply"); process.exit(2); }
const DRY = mode === "--dry-run";
const problems = [], changed = [];

// fn(text, once) が新しい本文を返す。once(text, from, to) は「fromがちょうど1回」なら置換、toが既にあれば適用済みとしてスキップ
function edit(file, fn) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) { problems.push(`${file}: ファイルが見つかりません`); return; }
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");
  const orig = crlf ? raw.replace(/\r\n/g, "\n") : raw;
  let bad = 0;
  const fail = msg => { bad++; problems.push(`${file}: ${msg}`); };
  const once = (t, from, to) => {
    if (t.includes(to)) return t;
    const n = t.split(from).length - 1;
    if (n !== 1) { fail(`「${from.slice(0, 40).replace(/\n/g, "⏎")}…」が${n}回見つかりました（期待: 1回）`); return t; }
    return t.replace(from, () => to);
  };
  const t = fn(orig, once, fail);
  if (bad) { problems.push(`${file}: 問題があったため書き込みません`); return; }
  if (t !== orig) { if (!DRY) fs.writeFileSync(p, crlf ? t.replace(/\n/g, "\r\n") : t); changed.push(file); }
}

// ------------------------------------------------------------
// app/components.css
// ------------------------------------------------------------
const NEW_CSS = `.user-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-lg);
  /* 浮遊メニューのみ影を許容 */
  min-width: 240px;
  /* 項目が増えても画面内に収め、メニュー内だけをスクロールさせる */
  max-height: calc(100vh - 96px);
  max-height: calc(100dvh - 96px);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  z-index: 99;
}

/* メール・プラン表示はスクロールしても上に残す */
.user-menu-head {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 16px;
  background: var(--bg);
  border-bottom: 1px solid var(--divider);
}

/* グループ見出し */
.user-menu-label {
  padding: 12px 16px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--meta);
  letter-spacing: 0.04em;
  background: var(--surface);
  border-bottom: 1px solid var(--divider);
}

/* メニュー外タップで閉じる＋背景スクロール防止用 */
.user-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 98;
  background: transparent;
  touch-action: none;
}

/* アカウント設定モーダルなどの項目リスト */
.settings-list {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
}

@media (max-width: 600px) {
  .user-menu-backdrop {
    background: rgba(0, 0, 0, 0.4);
  }

  /* 画面下のシート型。内側だけスクロールする */
  .user-menu {
    position: fixed;
    left: 8px;
    right: 8px;
    top: auto;
    bottom: calc(8px + env(safe-area-inset-bottom));
    max-height: calc(100vh - 72px);
    max-height: calc(100dvh - 72px);
    border-radius: var(--radius-lg);
  }

  .user-menu-item {
    min-height: 48px;
  }
}`;

edit("app/components.css", (t, once, fail) => {
  if (t.includes(".user-menu-backdrop")) return t;
  const re = /^\.user-menu \{[\s\S]*?\n\}/m;
  const n = (t.match(new RegExp(re.source, "gm")) ?? []).length;
  if (n !== 1) { fail(`.user-menu ブロックが${n}回見つかりました（期待: 1回）`); return t; }
  return t.replace(re, () => NEW_CSS);
});

// ------------------------------------------------------------
// components/TaskApp.tsx
// ------------------------------------------------------------
const MENU_BLOCK = `{showUserMenu && (
              <>
                <div className="user-menu-backdrop" onClick={() => setShowUserMenu(false)} aria-hidden="true" />
                <div className="user-menu" role="menu" aria-label="ユーザーメニュー">
                  <div className="user-menu-head">
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
                    {profile && <PlanBadge plan={profile.plan} />}
                  </div>

                  <div className="user-menu-label">プラン</div>
                  <button onClick={() => window.location.href = "/pricing"} disabled={!isOnline}
                    title={!isOnline ? "プラン変更はオンライン復帰後に利用できます" : undefined} className="user-menu-item accent">
                    <span className="user-menu-item-icon"><Icon name="creditCard" size={17} /></span>
                    <span>プランをアップグレード</span>
                  </button>
                  {profile?.plan === "premium" && (
                    <button onClick={() => { setShowShareSettings(true); setShowUserMenu(false); }} disabled={!isOnline}
                      title={!isOnline ? "共有ページ設定はオンライン復帰後に利用できます" : undefined} className="user-menu-item">
                      <span className="user-menu-item-icon"><Icon name="link" size={17} /></span>
                      <span>共有ページを設定</span>
                    </button>
                  )}

                  <div className="user-menu-label">通知</div>
                  <PushNotificationToggle enabled={isOnline} />
                  <NotifyHourSelect userId={user?.id ?? null} enabled={isOnline} />

                  <div className="user-menu-label">データ</div>
                  <button onClick={() => { setShowTagManager(true); setShowUserMenu(false); }} disabled={!isOnline}
                    title={!isOnline ? "タグ管理はオンライン復帰後に利用できます" : undefined} className="user-menu-item">
                    <span className="user-menu-item-icon"><Icon name="tag" size={17} /></span>
                    <span>タグを管理</span>
                  </button>
                  <button onClick={() => window.location.href = "/tools"} className="user-menu-item">
                    <span className="user-menu-item-icon"><Icon name="calendar" size={17} /></span>
                    <span>無料ツール</span>
                  </button>

                  <div className="user-menu-label">アカウント</div>
                  <button onClick={() => { setShowAccountSettings(true); setShowUserMenu(false); }} disabled={!isOnline}
                    title={!isOnline ? "アカウント設定はオンライン復帰後に利用できます" : undefined} className="user-menu-item">
                    <span className="user-menu-item-icon"><Icon name="user" size={17} /></span>
                    <span>アカウント設定</span>
                  </button>
                  {profile?.is_admin && (
                    <button onClick={() => window.location.href = "/admin"} disabled={!isOnline} className="user-menu-item accent">
                      <span className="user-menu-item-icon"><Icon name="users" size={17} /></span>
                      <span>管理者ページ</span>
                    </button>
                  )}
                  <button onClick={requestLogout} disabled={!isOnline}
                    title={!isOnline ? "ログアウトはオンライン復帰後に利用できます" : undefined} className="user-menu-item danger" style={{ fontWeight: 600 }}>
                    <span className="user-menu-item-icon"><Icon name="logout" size={17} /></span>
                    <span>ログアウト</span>
                  </button>
                </div>
              </>
            )}`;

edit("components/TaskApp.tsx", (t, once, fail) => {
  t = once(t,
    'const DeleteAccountModal = dynamic(() => import("./DeleteAccountModal"), { ssr: false });',
    'const DeleteAccountModal = dynamic(() => import("./DeleteAccountModal"), { ssr: false });\nconst AccountSettingsModal = dynamic(() => import("./AccountSettingsModal"), { ssr: false });');
  t = once(t,
    "  const [showDeleteAccount, setShowDeleteAccount] = useState(false);\n",
    "  const [showDeleteAccount, setShowDeleteAccount] = useState(false);\n  const [showAccountSettings, setShowAccountSettings] = useState(false);\n");

  // 背景スクロールのロック（ユーザーメニュー・アカウント設定の表示中を追加）＋ Escでメニューを閉じる
  t = once(t,
    '    if (showForm || detailId) {\n      document.body.style.overflow = "hidden";\n    } else {\n      document.body.style.overflow = "";\n    }\n    return () => { document.body.style.overflow = ""; };\n  }, [showForm, detailId]);\n',
    '    if (showForm || detailId || showUserMenu || showAccountSettings) {\n      document.body.style.overflow = "hidden";\n    } else {\n      document.body.style.overflow = "";\n    }\n    return () => { document.body.style.overflow = ""; };\n  }, [showForm, detailId, showUserMenu, showAccountSettings]);\n\n' +
    '  // Escキーでユーザーメニューを閉じる\n  useEffect(() => {\n    if (!showUserMenu) return;\n    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowUserMenu(false); };\n    window.addEventListener("keydown", onKey);\n    return () => window.removeEventListener("keydown", onKey);\n  }, [showUserMenu]);\n');

  // ユーザーメニュー本体の差し替え
  if (!t.includes("user-menu-backdrop")) {
    const startMark = '{showUserMenu && (\n              <div className="user-menu">';
    const endMark = "\n          </div>\n        </div>\n      </header>";
    const s = t.indexOf(startMark);
    const dup = s >= 0 ? t.indexOf(startMark, s + 1) : -1;
    const e = s >= 0 ? t.indexOf(endMark, s) : -1;
    if (s < 0 || dup >= 0 || e < 0) fail("ユーザーメニューのブロックを特定できませんでした");
    else t = t.slice(0, s) + MENU_BLOCK + t.slice(e);
  }

  // アカウント設定モーダルの描画（各操作は既存のモーダル・ハンドラをそのまま使う）
  t = once(t,
    "      <ShareSettingsModal open={showShareSettings} onClose={() => setShowShareSettings(false)} online={isOnline} />\n",
    "      <ShareSettingsModal open={showShareSettings} onClose={() => setShowShareSettings(false)} online={isOnline} />\n" +
    "      <AccountSettingsModal\n" +
    "        open={showAccountSettings}\n" +
    "        onClose={() => setShowAccountSettings(false)}\n" +
    "        online={isOnline}\n" +
    "        hasPassword={hasPassword}\n" +
    "        isGoogleLinked={isGoogleLinked}\n" +
    "        linking={linking}\n" +
    "        isAdmin={!!profile?.is_admin}\n" +
    "        onEditName={() => { setShowAccountSettings(false); setNameInput(profile?.display_name ?? \"\"); setShowNameEdit(true); }}\n" +
    "        onPassword={() => { setShowAccountSettings(false); openPasswordModal(); }}\n" +
    "        onLinkGoogle={() => { setShowAccountSettings(false); void handleLinkGoogle(); }}\n" +
    "        onUnlinkGoogle={() => { setShowAccountSettings(false); requestUnlinkGoogle(); }}\n" +
    "        onDeleteAccount={() => { setShowAccountSettings(false); setShowDeleteAccount(true); }}\n" +
    "      />\n");
  return t;
});

// ------------------------------------------------------------
// components/GuideFigures.tsx（ガイドの図）
// ------------------------------------------------------------
edit("components/GuideFigures.tsx", (t, once) => {
  t = once(t,
    '  { label: "名前を変更", icon: "user" },\n  { label: "パスワードを変更", icon: "lock" },\n  { label: "Googleと連携する", icon: "link" },\n  { label: "アカウントを削除", icon: "trash", tone: "danger" },\n',
    '  { label: "アカウント設定", icon: "user" },\n');
  // .user-menu の max-height / fixed 配置の影響を受けないようにする
  t = once(t,
    '<div className="user-menu" style={{ position: "static", maxWidth: 280, margin: "0 auto" }}>',
    '<div className="user-menu" style={{ position: "static", maxWidth: 280, margin: "0 auto", maxHeight: "none", overflow: "visible" }}>');
  return t;
});

// ------------------------------------------------------------
// lib/guide-pages.tsx（ガイド本文：操作場所の表記）
// ------------------------------------------------------------
edit("lib/guide-pages.tsx", (t, once) => {
  t = once(t, "プラン、通知、タグ、パスワード、ログアウトなどはここにまとまっています。", "プラン、通知、タグ、アカウント設定、ログアウトなどはここにまとまっています。");
  t = once(t,
    '<FigUserMenu highlight={["パスワード", "Google"]} caption="ユーザーメニューから、パスワードの変更・Google連携・名前の変更ができます。" />',
    '<FigUserMenu highlight={["アカウント設定"]} caption="ユーザーメニューの「アカウント設定」から、名前の変更・パスワード・Google連携・アカウント削除ができます。" />');
  t = once(t, "ユーザーメニューの<strong>「パスワードを変更」</strong>を開き", "ユーザーメニューの<strong>「アカウント設定」→「パスワードを変更」</strong>を開き");
  t = once(t, "メニューは<strong>「パスワードを設定」</strong>になっています。", "「アカウント設定」の項目は<strong>「パスワードを設定」</strong>になっています。");
  t = once(t, "ユーザーメニューの<strong>「Googleと連携する」</strong>を押して", "ユーザーメニューの<strong>「アカウント設定」→「Googleと連携する」</strong>を押して");
  t = once(t, "ユーザーメニューの<strong>「名前を変更」</strong>から", "ユーザーメニューの<strong>「アカウント設定」→「名前を変更」</strong>から");
  t = once(t, '"メニューの「アカウントを削除」"', '"メニューの「アカウント設定」→「アカウントを削除」"');
  t = once(t, "ユーザーメニューの<strong>「アカウントを削除」</strong>から、自分で", "ユーザーメニューの<strong>「アカウント設定」→「アカウントを削除」</strong>から、自分で");
  return t;
});

// ------------------------------------------------------------
// README.md
// ------------------------------------------------------------
edit("README.md", (t, once) => {
  t = once(t,
    "- ✅ アカウントの即時削除（本人がユーザーメニューから実行。",
    "- ✅ アカウントの即時削除（本人がユーザーメニュー →「アカウント設定」から実行。");
  t = once(t,
    "- ✅ ユーザーメニューのテキスト折り返し防止\n",
    "- ✅ ユーザーメニューのテキスト折り返し防止\n" +
    "- ✅ ユーザーメニューのスクロール制御（メニュー内だけがスクロールし、表示中は背景をロック。スマホは下からのシート型。項目は「プラン / 通知 / データ / アカウント」にグループ化。Escキー・外側タップで閉じる）\n" +
    "- ✅ アカウント設定モーダル（`components/AccountSettingsModal.tsx`。名前変更・パスワード設定/変更・Google連携/解除・アカウント削除を集約。実処理は `TaskApp.tsx` の既存ハンドラ・モーダルを呼ぶ）\n");
  t = once(t,
    "  ブランドロゴ（Google の G）は線アイコンにせず、`GoogleLogo`（`TaskShared.tsx`・公式SVG）を使う。\n",
    "  ブランドロゴ（Google の G）は線アイコンにせず、`GoogleLogo`（`TaskShared.tsx`・公式SVG）を使う。\n" +
    "- ユーザーメニューなど縦に長くなる浮遊面は、`max-height` + `overflow-y: auto` + `overscroll-behavior: contain` で内部スクロールにし、表示中は背景スクロールをロックする。\n" +
    "  項目を追加するときは `.user-menu-label` のグループに入れる。アカウント系の操作はユーザーメニューに直接足さず、`AccountSettingsModal` に追加する。\n");
  return t;
});

console.log(DRY ? "[dry-run] 変更される（された）ファイル:" : "変更したファイル:");
changed.forEach(f => console.log("  M", f));
if (changed.length === 0 && problems.length === 0) console.log("  （なし。すでに適用済みです）");
if (problems.length) { console.error("\n要確認（該当ファイルは書き込んでいません）:"); problems.forEach(p => console.error("  !", p)); process.exitCode = 1; }
else console.log(DRY ? "\n問題なし。--apply で実行してください。" : "\n完了。git diff で確認してください。");
