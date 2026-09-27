import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { iotDb, BIN_ID } from "../iotConfig";

const COMPARTMENTS = ["plastic", "food", "metal"];

// The ESP32 firmware computes and uploads this exact status string per
// compartment — EMPTY / LOW / HALF / 75% / FULL / ERROR — rather than the
// app re-deriving a status from `level`. Keep this in sync with the
// firmware's status enum (see Sensor_Algorithms / System_Logic docs).
function levelClass(status) {
  switch ((status || "").toUpperCase()) {
    case "FULL":
    case "ERROR":
      return "level-critical";
    case "HALF":
    case "75%":
      return "level-warning";
    default:
      return "level-ok";
  }
}

function statusLabel(status) {
  if (!status) return "No data";
  const upper = status.toUpperCase();
  if (upper === "75%") return "75% full";
  return upper.charAt(0) + upper.slice(1).toLowerCase();
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
                <p className={`level ${levelClass(c.status)}`}>
                  {c.level != null ? `${c.level}%` : "—"}
                </p>
                <span className={`badge ${levelClass(c.status) === "level-critical" ? "status-cancelled" : levelClass(c.status) === "level-warning" ? "status-pending" : "status-completed"}`}>
                  {statusLabel(c.status)}
                </span>
                {c.overweight && <p className="overweight-alert">⚠ Overweight</p>}
                <dl>
                  <dt>Weight</dt>
                  <dd>{c.weight != null ? `${c.weight} kg` : "—"}</dd>
                  {c.moisture != null && (
                    <>
                      <dt>Moisture</dt>
                      <dd>{c.moisture}%</dd>
                    </>
                  )}
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
