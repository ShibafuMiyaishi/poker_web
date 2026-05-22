// プライバシーポリシー。仕様 §12.4「保存するのは Google sub・メアド・ハンドル名のみ」を反映。
export function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto prose prose-invert prose-sm text-slate-200">
      <h2 className="text-lg font-semibold">プライバシーポリシー</h2>
      <p className="text-xs text-slate-400">最終更新: 2026 年 5 月</p>

      <h3 className="text-sm font-semibold mt-4">1. 取得する情報</h3>
      <ul className="text-xs list-disc pl-5">
        <li>
          Google OAuth 経由のログイン時: Google アカウントの
          sub（一意識別子）、メールアドレス、表示名
        </li>
        <li>ゲストモード時: ブラウザで生成した一意の UUID（個人情報を含まない）</li>
        <li>プレイデータ: ハンド履歴・アクション・統計（ホールカード、ベット履歴、勝敗）</li>
      </ul>

      <h3 className="text-sm font-semibold mt-4">2. 利用目的</h3>
      <ul className="text-xs list-disc pl-5">
        <li>利用者のアカウント識別とセッション維持</li>
        <li>ハンド履歴・統計画面の表示</li>
        <li>分析（EV・GTO 比較）の提供</li>
        <li>不正利用の検知</li>
      </ul>

      <h3 className="text-sm font-semibold mt-4">3. 第三者提供</h3>
      <p className="text-xs">
        運営者は利用者の個人情報を、法令に基づく開示要求がある場合を除き、第三者に提供しません。
        メールアドレスは他の利用者には公開されず、ハンドル名のみが対戦相手に表示されます。
      </p>

      <h3 className="text-sm font-semibold mt-4">4. クッキー・ローカルストレージ</h3>
      <p className="text-xs">
        セッション維持のため、JWT および client_uuid を localStorage に保存します。 Google OAuth
        のリダイレクトには HttpOnly Cookie で state を一時的に保持します。
      </p>

      <h3 className="text-sm font-semibold mt-4">5. 広告</h3>
      <p className="text-xs">
        ロビー画面・履歴画面・統計画面に Google AdSense 広告を表示する場合があります。
        プレイ画面（卓画面）には広告を表示しません。AdSense は Cookie
        を使用して関連性のある広告を配信する場合があります。詳細は
        <a
          href="https://policies.google.com/technologies/partner-sites"
          className="underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          Google のポリシー
        </a>
        を参照してください。
      </p>

      <h3 className="text-sm font-semibold mt-4">6. データ削除</h3>
      <p className="text-xs">
        利用者は運営者に対しアカウント削除を要求できます。削除時、users
        行の個人情報は削除（ハンド履歴は統計用に 匿名化保持）します。
      </p>

      <h3 className="text-sm font-semibold mt-4">7. お問い合わせ</h3>
      <p className="text-xs">
        本ポリシーに関するお問い合わせは、サービス内のフィードバック窓口までお願いします。
      </p>
    </article>
  );
}
