import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
type Block = { batch_id: number; code: string; oven_id: number; oven_label: string; phase: string; start_min: number; end_min: number };
type Oven = { id: number; label: string; open_min: number; close_min: number };
const DAY_START = 8 * 60, DAY_END = 18 * 60, SPAN = DAY_END - DAY_START;
function pct(m: number) { return ((m - DAY_START) / SPAN) * 100; }
function fmt(m: number) { const h = Math.floor(m / 60), mm = m % 60; return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`; }
export default function GanttPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [ovens, setOvens] = useState<Oven[]>([]);
  useEffect(() => {
    api<Block[]>("/gantt").then(setBlocks);
    api<Oven[]>("/ovens").then(setOvens);
  }, []);
  const rows = useMemo(() => {
    // 以炉位为准渲染每一行（含暂无批次的炉），并标出该炉营业带
    return ovens.map((o) => ({
      oven: o,
      blocks: blocks.filter((b) => b.oven_id === o.id),
    }));
  }, [ovens, blocks]);
  return (<>
    <h2>甘特（生产占炉）</h2>
    <div className="axis"><div /><div className="axis-scale"><span>08:00</span><span>12:00</span><span>18:00</span></div></div>
    <div className="gantt">
      {rows.map(({ oven, blocks: rowBlocks }) => {
        const bandLeft = Math.max(0, pct(oven.open_min));
        const bandRight = Math.min(100, pct(oven.close_min));
        return (
          <div className="gantt-row" key={oven.id}>
            <div>{oven.label}</div>
            <div className="gantt-track">
              {bandRight > bandLeft && (
                <div
                  className="gantt-hours"
                  style={{ left: `${bandLeft}%`, width: `${bandRight - bandLeft}%` }}
                  title={`营业 ${fmt(oven.open_min)}–${fmt(oven.close_min)}（打烊点不可排）`}
                />
              )}
              {rowBlocks.map((b, i) => (
                <div key={i} className={`gantt-block ${b.phase}`}
                  style={{ left: `${pct(b.start_min)}%`, width: `${((b.end_min - b.start_min) / SPAN) * 100}%` }}
                  title={`${b.code} ${b.phase}`}>
                  {b.code}/{b.phase === "ferment" ? "酵" : "烤"}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </>);
}
