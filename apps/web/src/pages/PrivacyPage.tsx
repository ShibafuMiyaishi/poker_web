import { SectionLabel } from '../components/primitives/SectionLabel';

export function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 pb-12">
      <SectionLabel jp="プライバシーポリシー" en="Privacy Policy" />
      <p className="font-display italic text-xs text-ivory-muted">
        Last updated 2026.05 — 最終更新 2026 年 5 月
      </p>

      <Section jp="1. 取得する情報" en="Data Collected">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Google OAuth 経由のログイン時: Google アカウントの
            sub（一意識別子）、メールアドレス、表示名
          </li>
          <li>ゲストモード時: ブラウザで生成した一意の UUID（個人情報を含まない）</li>
          <li>プレイデータ: ハンド履歴・アクション・統計（ホールカード、ベット履歴、勝敗）</li>
        </ul>
      </Section>

      <Section jp="2. 利用目的" en="Purpose of Use">
        <ul className="list-disc pl-5 space-y-1">
          <li>利用者のアカウント識別とセッション維持</li>
          <li>ハンド履歴・統計画面の表示</li>
          <li>分析（EV・GTO 比較）の提供</li>
          <li>不正利用の検知</li>
        </ul>
      </Section>

      <Section jp="3. 第三者提供" en="Third Parties">
        運営者は利用者の個人情報を、法令に基づく開示要求がある場合を除き、第三者に提供しません。
        メールアドレスは他の利用者には公開されず、ハンドル名のみが対戦相手に表示されます。
      </Section>

      <Section jp="4. クッキー・ローカルストレージ" en="Cookies & Storage">
        セッション維持のため、JWT および client_uuid を localStorage に保存します。 Google OAuth
        のリダイレクトには HttpOnly Cookie で state を一時的に保持します。
      </Section>

      <Section jp="5. 広告" en="Advertising">
        ロビー画面・履歴画面・統計画面に Google AdSense 広告を表示する場合があります。
        プレイ画面（卓画面）には広告を表示しません。AdSense は Cookie
        を使用して関連性のある広告を配信する場合があります。詳細は{' '}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          className="text-brass hover:text-brass-light underline-offset-2 underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          Google のポリシー
        </a>{' '}
        を参照してください。
      </Section>

      <Section jp="6. データ削除" en="Data Deletion">
        利用者は運営者に対しアカウント削除を要求できます。削除時、users
        行の個人情報は削除（ハンド履歴は統計用に匿名化保持）します。
      </Section>

      <Section jp="7. お問い合わせ" en="Contact">
        本ポリシーに関するお問い合わせは、サービス内のフィードバック窓口までお願いします。
      </Section>
    </article>
  );
}

function Section({
  jp,
  en,
  children,
}: {
  jp: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-baseline gap-3 border-b border-brass/20 pb-1.5">
        <span className="font-jp text-base text-ivory tracking-wider">{jp}</span>
        <span className="font-display italic text-[11px] text-brass tracking-widest uppercase opacity-70">
          {en}
        </span>
      </h3>
      <div className="text-sm text-ivory-dim leading-relaxed font-display">{children}</div>
    </section>
  );
}
