import { SectionLabel } from '../components/primitives/SectionLabel';

// 利用規約: 編集デザイン的に組む。明朝の見出し + 細かい英 italic note。
export function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 pb-12">
      <SectionLabel jp="利用規約" en="Terms of Service" />
      <p className="font-display italic text-xs text-ivory-muted">
        Last updated 2026.05 — 最終更新 2026 年 5 月
      </p>

      <Section jp="1. 本サービスについて" en="About">
        Pokergo（以下「本サービス」）は、Fumiya が個人で運営する仮想チップによる
        テキサスホールデム・ポーカーの学習・娯楽用 Web アプリケーションです。
      </Section>

      <Section jp="2. 賭博性の不在" en="No Gambling">
        本サービスで取り扱うチップは{' '}
        <strong className="brass-text font-display font-bold">
          仮想のものに限り、現実通貨や金品との交換は一切不可
        </strong>
        です。サービス内・外を問わず、利用者間でチップを売買・譲渡することは禁止します。
        本サービスは賭博を提供するものではありません。
      </Section>

      <Section jp="3. 利用者の責任" en="User Responsibility">
        <ul className="list-disc pl-5 space-y-1">
          <li>自己のアカウント情報・ハンドル名を適切に管理する責任を負います。</li>
          <li>
            他者を誹謗中傷する、不正なツールを使用する、リバースエンジニアリングを行う等の行為を禁止します。
          </li>
          <li>1 つの Google アカウントで同一卓に複数席着座することはできません。</li>
        </ul>
      </Section>

      <Section jp="4. ハンド履歴・統計の取扱い" en="Data Handling">
        利用者のプレイデータ（ハンド履歴、アクション、統計）はサーバに保存され、本人が 履歴画面 /
        統計画面で閲覧できます。詳細は「プライバシーポリシー」を参照してください。
      </Section>

      <Section jp="5. 免責" en="Disclaimer">
        本サービスは現状有姿で提供され、運営者は利用者の損害について一切の責任を負いません。
        サービスは予告なく停止・終了する場合があります。
      </Section>

      <Section jp="6. 規約の変更" en="Amendments">
        本規約は予告なく改定されることがあります。改定後の規約はサービス上に掲示された時点で効力を持ちます。
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
