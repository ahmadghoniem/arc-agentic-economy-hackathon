"use client"

const marginRows = [
  {
    label: "Gateway cost per call",
    cost: "~$0.0001",
    percent: 1,
    tone: "bg-success",
  },
  {
    label: "L2 gas per call",
    cost: "~$0.0050",
    percent: 50,
    tone: "bg-risk",
  },
]

export function UnitEconomics() {
  return (
    <section className="p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Unit Economics
        </span>
        <span className="font-mono text-xs font-medium text-payment">
          $0.01 / call
        </span>
      </div>

      <div className="space-y-3">
        {marginRows.map((row) => (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground/80">
                {row.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {row.cost} ({row.percent}%)
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${row.tone}`}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs leading-4 text-muted-foreground/70">
        Per-call L2 gas inevitably kills sub-cent pricing
        <p>Circle Gateway batches signatures off-chain, </p>
        <p>making micropayments economically viable.</p>
      </div>
    </section>
  )
}
