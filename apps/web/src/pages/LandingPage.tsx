import { LogoMark } from '../components/primitives/LogoMark';

interface Props {
  onStart: () => void;
  onGoogleLogin: () => void;
}

// 未ログイン (初回訪問) 向けランディングページ。
// Ten-Four 風の 1 ページ完結。差別化要素 3 つを **緑ハイライター** で強調。
// Botanical Vault の世界観は残しつつ、コア価値訴求を最前面に。
export function LandingPage({ onStart, onGoogleLogin }: Props) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex flex-col items-center justify-center gap-10 sm:gap-14 px-4 py-12 max-w-3xl mx-auto">
      {/* ロゴ + タグライン */}
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark size={88} />
        <div className="flex items-baseline gap-4">
          <h1 className="font-display font-black text-5xl sm:text-6xl brass-text tracking-tight leading-none">
            Pokergo
          </h1>
          <span className="font-jp text-xs sm:text-sm text-ivory-muted tracking-widest">
            ポーカーゴー
          </span>
        </div>
        <p className="font-jp text-[11px] text-ivory-muted tracking-widest mt-1">
          8-MAX NLH · 仮想チップ専用 · 賭博行為一切なし
        </p>
      </div>

      {/* 訴求 3 行 (Ten-Four 風 highlighter) */}
      <ul className="space-y-3 sm:space-y-4 text-center font-jp-sans text-base sm:text-xl text-ivory leading-relaxed">
        <li>
          各アクションの<span className="hi-jade">最善手</span>を、 ハンドごとに学べる。
        </li>
        <li>
          <span className="hi-jade">CPU 7 体</span>と常時 8 人卓。 待ち時間はゼロ。
        </li>
        <li>
          完全無料。賭けるのは<span className="hi-jade">プライド</span>だけ。
        </li>
      </ul>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={onStart}
          className="w-full px-6 py-3 rounded-md font-display tracking-widest text-base brass-surface text-ivory hover:brightness-110 transition focus-visible:ring-2 focus-visible:ring-brass-glow shadow-brass"
        >
          すぐ卓につく ▸
        </button>
        <button
          type="button"
          onClick={onGoogleLogin}
          className="w-full px-4 py-2.5 rounded-md border border-brass/45 bg-ink-deep/60 text-ivory-dim hover:text-ivory hover:border-brass transition font-jp-sans text-sm tracking-wider"
        >
          <span className="text-jade-glow mr-1">●</span> Google でログイン
          <span className="text-[10px] text-ivory-muted ml-2">(履歴を他端末と同期)</span>
        </button>
        <p className="text-[10px] text-ivory-muted font-jp-sans text-center leading-relaxed mt-1">
          ログイン無しでもゲストとして即プレイ可能。
          <br />
          履歴と統計はブラウザ内に保存されます。
        </p>
      </div>

      {/* 差別化要素 (Pokergo の固有強み — Ten-Four にも無い) */}
      <section className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
        <Feature
          jp="EV / GTO 自動分析"
          en="Action Verdict"
          desc="ハンド終了直後に ◎○△✗ の判定。なぜ +EV/-EV か日本語の理由付き。"
        />
        <Feature
          jp="推定レンジ可視化"
          en="Range Heatmap"
          desc="相手のホールカードを GTO チャート + 行動履歴で推定し、169 ハンド grid で表示。"
        />
        <Feature
          jp="ハンドリプレイ"
          en="Hand Replay"
          desc="任意のハンドをストリート別に再生。PokerStars 形式コピーで LLM 分析も。"
        />
      </section>

      <p className="text-[10px] text-ivory-muted font-jp-sans text-center mt-2 max-w-md">
        当アプリでは一切の賭博行為を行えません。
        全てのチップは仮想であり、現実通貨との交換は不可能です。
      </p>
    </div>
  );
}

function Feature({ jp, en, desc }: { jp: string; en: string; desc: string }) {
  return (
    <div className="relative rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/90 to-ink-abyss/70 p-3 sm:p-4 paper-noise">
      <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/45 to-transparent" />
      <div className="font-jp text-sm text-brass-light tracking-widest font-bold">{jp}</div>
      <div className="font-display italic text-[10px] text-ivory-muted tracking-widest uppercase mt-0.5">
        {en}
      </div>
      <p className="font-jp-sans text-[11px] text-ivory-dim leading-relaxed mt-2">{desc}</p>
    </div>
  );
}
