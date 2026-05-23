import { Component, type ErrorInfo, type ReactNode } from 'react';
import { LogoMark } from './primitives/LogoMark';

// アプリ全体を包む React Error Boundary。
// JS の予期せぬ例外 (Promise reject 以外) で **白画面** にならないようにする。
// 本番では Sentry 等への送信を後付けできるよう componentDidCatch を抽出。

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // 観測性: Workers / Sentry にここから送る (現状は console)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reload = () => {
    // 再マウントしてリセット (location.reload より状態保全しやすい)
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const msg = this.state.error?.message ?? 'unknown';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-ivory">
        <LogoMark size={64} />
        <div className="text-center max-w-md">
          <h1 className="font-display font-black text-3xl brass-text tracking-tight mb-2">
            予期せぬエラー
          </h1>
          <p className="font-jp-sans text-sm text-ivory-dim leading-relaxed">
            申し訳ありません。アプリ内で例外が発生しました。再読み込みするか、
            <br />
            「もう一度試す」を押してください。
          </p>
        </div>
        <details className="text-[10px] text-ivory-muted max-w-md font-mono-tabular">
          <summary className="cursor-pointer font-jp tracking-widest hover:text-brass">
            エラー詳細 ▾
          </summary>
          <pre className="mt-2 p-2 bg-ink-deepest/70 rounded border border-ink-line text-[10px] whitespace-pre-wrap break-all">
            {msg}
          </pre>
        </details>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={this.reload}
            className="px-5 py-2.5 rounded-md brass-surface text-ivory font-display tracking-widest hover:brightness-110 transition"
          >
            もう一度試す
          </button>
          <button
            type="button"
            onClick={() => location.reload()}
            className="px-5 py-2.5 rounded-md border border-ivory-muted/30 text-ivory-dim font-jp-sans tracking-widest hover:border-brass hover:text-ivory transition"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }
}
