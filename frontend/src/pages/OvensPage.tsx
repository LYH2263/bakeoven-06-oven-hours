import { useEffect, useState } from "react";
import { api } from "../api/client";

type O = { id: number; label: string; capacity_note: string; open_min: number; close_min: number };

function fmt(m: number) {
  const h = Math.floor(m / 60), mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function parse(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function OvensPage() {
  const [rows, setRows] = useState<O[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { open: string; close: string }>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<O[]>("/ovens").then((os) => {
      setRows(os);
      setDrafts(Object.fromEntries(os.map((o) => [o.id, { open: fmt(o.open_min), close: fmt(o.close_min) }])));
    });
  }, []);

  async function save(o: O) {
    setMsg(""); setErr("");
    const d = drafts[o.id];
    if (!d) return;
    const open_min = parse(d.open), close_min = parse(d.close);
    if (open_min >= close_min) {
      setErr(`${o.label}：打烊时间必须晚于开门时间`);
      return;
    }
    try {
      const u = await api<O>(`/ovens/${o.id}/hours`, {
        method: "PUT",
        body: JSON.stringify({ open_min, close_min }),
      });
      setRows((rs) => rs.map((r) => (r.id === u.id ? u : r)));
      setMsg(`已保存 ${u.label} 营业时段 ${fmt(u.open_min)}–${fmt(u.close_min)}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (<>
    <h2>炉位</h2>
    {msg && <div className="ok">{msg}</div>}
    {err && <div className="err">{err}</div>}
    <table className="table">
      <thead><tr><th>标签</th><th>备注</th><th>开门</th><th>打烊</th><th></th></tr></thead>
      <tbody>{rows.map((o) => {
        const d = drafts[o.id] ?? { open: fmt(o.open_min), close: fmt(o.close_min) };
        return (
          <tr key={o.id}>
            <td>{o.label}</td>
            <td>{o.capacity_note}</td>
            <td>
              <input
                type="time"
                value={d.open}
                onChange={(e) => setDrafts((s) => ({ ...s, [o.id]: { ...d, open: e.target.value } }))}
              />
            </td>
            <td>
              <input
                type="time"
                value={d.close}
                onChange={(e) => setDrafts((s) => ({ ...s, [o.id]: { ...d, close: e.target.value } }))}
              />
            </td>
            <td><button onClick={() => save(o)}>保存</button></td>
          </tr>
        );
      })}</tbody>
    </table>
    <p className="hint">打烊点本身不可排产（半开区间）；未改过的炉默认 08:00–22:00。</p>
  </>);
}
