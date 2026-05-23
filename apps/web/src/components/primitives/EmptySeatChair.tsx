// 空席のイラスト: 古い木の椅子のシルエット (botanical / vault 雰囲気)
export function EmptySeatChair({ seatNo }: { seatNo: number }) {
  return (
    <div
      className="w-[110px] sm:w-[130px] flex flex-col items-center gap-1 py-2 opacity-55 hover:opacity-80 transition"
      aria-label={`seat ${seatNo} is open`}
    >
      <svg
        width="44"
        height="56"
        viewBox="0 0 56 72"
        fill="none"
        aria-hidden="true"
        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <linearGradient id={`chair-${seatNo}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c89f48" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#6f5520" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* 背もたれ */}
        <rect
          x="18"
          y="6"
          width="20"
          height="28"
          rx="3"
          fill="none"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="1.4"
        />
        <line
          x1="22"
          y1="12"
          x2="34"
          y2="12"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="0.7"
          opacity="0.6"
        />
        <line
          x1="22"
          y1="20"
          x2="34"
          y2="20"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="0.7"
          opacity="0.6"
        />
        <line
          x1="22"
          y1="28"
          x2="34"
          y2="28"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="0.7"
          opacity="0.6"
        />
        {/* 座面 */}
        <rect x="12" y="36" width="32" height="6" rx="1.5" fill={`url(#chair-${seatNo})`} />
        {/* 脚 */}
        <line
          x1="16"
          y1="42"
          x2="14"
          y2="66"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="42"
          x2="42"
          y2="66"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="22"
          y1="42"
          x2="22"
          y2="66"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1="34"
          y1="42"
          x2="34"
          y2="66"
          stroke={`url(#chair-${seatNo})`}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      <div className="text-[9px] font-jp tracking-widest text-ivory-muted">
        空席 <span className="font-mono-tabular ml-1">{seatNo}</span>
      </div>
    </div>
  );
}
