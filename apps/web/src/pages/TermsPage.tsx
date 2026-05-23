import { SectionLabel } from '../components/primitives/SectionLabel';

// 利用規約 v2: 雑誌風レイアウト。
// - 巨大な漢字数字を drop cap 的に配置
// - 朱印で各セクションを「押印」
export function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-12">
      <header className="border-b border-brass/30 pb-4">
        <SectionLabel jp="利用規約" en="Terms of Service" size="lg" />
        <p className="font-jp text-xs text-ivory-muted mt-2 tracking-widest">
          最終更新 2026 年 5 月
        </p>
      </header>

      <Section num="一" jp="本サービスについて">
        Pokergo（以下「本サービス」）は、Fumiya が個人で運営する仮想チップによる
        テキサスホールデム・ポーカーの学習・娯楽用 Web アプリケーションです。
      </Section>

      <Section num="二" jp="賭博性の不在" emphasize>
        本サービスで取り扱うチップは{' '}
        <strong className="brass-text font-display font-bold">
          仮想のものに限り、現実通貨や金品との交換は一切不可
        </strong>
        です。サービス内・外を問わず、利用者間でチップを売買・譲渡することは禁止します。
        本サービスは賭博を提供するものではありません。
      </Section>

      <Section num="三" jp="利用者の責任">
        <ul className="list-disc pl-5 space-y-1">
          <li>自己のアカウント情報・ハンドル名を適切に管理する責任を負います。</li>
          <li>
            他者を誹謗中傷する、不正なツールを使用する、リバースエンジニアリングを行う等の行為を禁止します。
          </li>
          <li>1 つの Google アカウントで同一卓に複数席着座することはできません。</li>
        </ul>
      </Section>

      <Section num="四" jp="ハンド履歴・統計の取扱い">
        利用者のプレイデータ（ハンド履歴、アクション、統計）はサーバに保存され、本人が 履歴画面 /
        統計画面で閲覧できます。詳細は「プライバシーポリシー」を参照してください。
      </Section>

      <Section num="五" jp="免責">
        本サービスは現状有姿で提供され、運営者は利用者の損害について一切の責任を負いません。
        サービスは予告なく停止・終了する場合があります。
      </Section>

      <Section num="六" jp="規約の変更">
        本規約は予告なく改定されることがあります。改定後の規約はサービス上に掲示された時点で効力を持ちます。
      </Section>
    </article>
  );
}

interface SectionProps {
  num: string;
  jp: string;
  children: React.ReactNode;
  emphasize?: boolean;
}

function Section({ num, jp, children, emphasize }: SectionProps) {
  return (
    <section className="grid grid-cols-[auto_1fr] gap-5">
      {/* 巨大な漢数字 (drop-cap-ish) */}
      <div className="flex items-start pt-1">
        <span className="font-jp text-5xl sm:text-6xl font-bold brass-text leading-none select-none">
          {num}
        </span>
      </div>
      <div className="space-y-2 border-l border-brass/20 pl-4 sm:pl-5">
        <h3 className="font-jp text-base sm:text-lg text-ivory tracking-wider font-semibold">
          {jp}
        </h3>
        <div
          className={`text-sm leading-relaxed font-jp ${
            emphasize ? 'text-ivory' : 'text-ivory-dim'
          }`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
