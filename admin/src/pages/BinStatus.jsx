import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { iotDb, BIN_ID } from "../iotConfig";

const COMPARTMENTS = ["plastic", "food", "metal"];

function levelClass(level) {
  if (level == null) return "";
  if (level > 80) return "level-critical";
  if (level > 50) return "level-warning";
  return "level-ok";
}

export default function BinStatus() {
  const [bin, setBin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const binNodeRef = ref(iotDb, `bins/${BIN_ID}`);
    const unsubscribe = onValue(
      binNodeRef,
      (snapshot) => {
        setBin(snapshot.val());
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  return (
    <section>
      <h1>Live Bin Status — {BIN_ID}</h1>
      <p className="subtitle">Realtime Database, ESP32 firmware</p>

      {loading && <p>Loading…</p>}
      {!loading && !bin && <p>No data reported yet for this bin.</p>}

      <div className="card-grid">
        {bin &&
          COMPARTMENTS.map((type) => {
            const c = bin[type] || {};
            return (
              <div className="card" key={type}>
                <h3>{type}</h3>
                <p className={`level ${levelClass(c.level)}`}>
                  {c.level != null ? `${c.level}%` : "—"}
                </p>
                <dl>
                  <dt>Weight</dt>
                  <dd>{c.weight != null ? `${c.weight} kg` : "—"}</dd>
                  <dt>Moisture</dt>
                  <dd>{c.moisture != null ? `${c.moisture}%` : "—"}</dd>
                  <dt>Overweight</dt>
                  <dd>{c.overweight ? "Yes" : "No"}</dd>
                  <dt>Status</dt>
                  <dd>{c.status || "—"}</dd>
                  <dt>Last reading</dt>
                  <dd>{c.timestamp || "—"}</dd>
                </dl>
              </div>
            );
          })}
      </div>
    </section>
  );
}
