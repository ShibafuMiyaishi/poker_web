// 利用規約。仕様 §13.2 の AdSense ポリシー（賭博と誤認させない）を考慮した文言。
// Phase 5 MVP 用ドラフト。法的妥当性は公開前に Owner が確認すること。
export function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto prose prose-invert prose-sm text-slate-200">
      <h2 className="text-lg font-semibold">利用規約</h2>
      <p className="text-xs text-slate-400">最終更新: 2026 年 5 月</p>

      <h3 className="text-sm font-semibold mt-4">1. 本サービスについて</h3>
      <p className="text-xs">
        Pokergo（以下「本サービス」）は、Fumiya が個人で運営する仮想チップによる
        テキサスホールデム・ポーカーの学習・娯楽用 Web アプリケーションです。
      </p>

      <h3 className="text-sm font-semibold mt-4">2. 賭博性の不在</h3>
      <p className="text-xs">
        本サービスで取り扱うチップは **仮想のものに限り、現実通貨や金品との交換は一切不可** です。
        サービス内・外を問わず、利用者間でチップを売買・譲渡することは禁止します。
        本サービスは賭博を提供するものではありません。
      </p>

      <h3 className="text-sm font-semibold mt-4">3. 利用者の責任</h3>
      <ul className="text-xs list-disc pl-5">
        <li>利用者は自己のアカウント情報・ハンドル名を適切に管理する責任を負います。</li>
        <li>
          他者を誹謗中傷する、不正なツールを使用する、リバースエンジニアリングを行う等の行為を禁止します。
        </li>
        <li>1 つの Google アカウントで同一卓に複数席着座することはできません。</li>
      </ul>

      <h3 className="text-sm font-semibold mt-4">4. ハンド履歴・統計の取扱い</h3>
      <p className="text-xs">
        利用者のプレイデータ（ハンド履歴、アクション、統計）はサーバに保存され、本人が 履歴画面 /
        統計画面で閲覧できます。詳細は「プライバシーポリシー」を参照してください。
      </p>

      <h3 className="text-sm font-semibold mt-4">5. 免責</h3>
      <p className="text-xs">
        本サービスは現状有姿で提供され、運営者は利用者の損害について一切の責任を負いません。
        サービスは予告なく停止・終了する場合があります。
      </p>

      <h3 className="text-sm font-semibold mt-4">6. 規約の変更</h3>
      <p className="text-xs">
        本規約は予告なく改定されることがあります。改定後の規約はサービス上に掲示された時点で効力を持ちます。
      </p>
    </article>
  );
}
