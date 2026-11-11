interface SeanceTableProps {
  lit: number;
  total: number;
}

/**
 * The s\u00e9ance table in Haunted view: one candle per round, lit for each right answer.
 * Decorative only; the progress line says the same thing in words.
 */
export function SeanceTable({ lit, total }: SeanceTableProps) {
  return (
    <div className="seance-table" aria-hidden="true" data-testid="seance-table">
      <div className="seance-candles">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < lit ? 'seance-candle is-lit' : 'seance-candle'} data-testid="seance-candle">
            <span className="seance-glow" />
            <span className="seance-flame" />
            <span className="seance-wick" />
            <span className="seance-wax" />
          </span>
        ))}
      </div>
      <div className="seance-cloth" />
    </div>
  );
}