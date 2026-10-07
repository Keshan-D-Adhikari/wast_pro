import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { iotDb, BIN_ID, USE_MOCK_IOT, MOCK_BIN_DATA_NORMAL, MOCK_BIN_DATA_ALERT } from "../iotConfig";
import { IconBin, IconAlert, IconPulse, IconLeaf } from "../components/Icons";

const COMPARTMENTS = ["plastic", "food", "metal"];

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
  const [liveBin, setLiveBin] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [mockPreset, setMockPreset] = useState("normal");

  // In mock mode the bin data is derived from the selected preset during
  // render, rather than copied into state from an effect.
  const bin = USE_MOCK_IOT
    ? (mockPreset === "alert" ? MOCK_BIN_DATA_ALERT : MOCK_BIN_DATA_NORMAL)
    : liveBin;
  const loading = USE_MOCK_IOT ? false : liveLoading;

  useEffect(() => {
    if (USE_MOCK_IOT) return;

    const binNodeRef = ref(iotDb, `bins/${BIN_ID}`);
    return onValue(
      binNodeRef,
      (snapshot) => {
        setLiveBin(snapshot.val());
        setLiveLoading(false);
      },
      () => setLiveLoading(false)
    );
  }, []);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Live Smart Bin Telemetry</h1>
          <p className="subtitle">Real-time ultrasonic fill level, weight, and moisture readings from IoT ESP32 firmware</p>
        </div>
      </div>

      {USE_MOCK_IOT && (
        <div style={{
          backgroundColor: "var(--status-warning-tint)",
          border: "1px solid rgba(180, 83, 9, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-xs)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span className="badge" style={{ backgroundColor: "var(--status-warning)", color: "#ffffff", fontWeight: 800 }}>
                  DEMO / MOCK TELEMETRY
                </span>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--status-warning)" }}>
                  Simulated Hardware Mode
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--ink-700)" }}>
                Displaying mock sensor data for testing without physical ESP32. Switch presets below:
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.65rem" }}>
              <button
                type="button"
                className={mockPreset === "normal" ? "btn-sm-success" : "load-more-btn"}
                style={{ margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                onClick={() => setMockPreset("normal")}
              >
                Preset: Normal (Low / Half)
              </button>
              <button
                type="button"
                className={mockPreset === "alert" ? "btn-sm-danger" : "load-more-btn"}
                style={{ margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                onClick={() => setMockPreset("alert")}
              >
                Preset: Alert (Full / Overweight)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bin-meta-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div className="bin-id-badge">
            <IconBin size={16} />
            <span>Prototype {BIN_ID}</span>
          </div>
          <span style={{ fontSize: "0.9rem", color: "var(--ink-500)" }}>
            Hardware Node: <code>bins/{BIN_ID}</code>
          </span>
        </div>

        <div className="system-status-pill" style={{
          backgroundColor: USE_MOCK_IOT ? "var(--status-warning-tint)" : "var(--status-success-tint)",
          color: USE_MOCK_IOT ? "var(--status-warning)" : "var(--status-success)",
          borderColor: USE_MOCK_IOT ? "rgba(180, 83, 9, 0.2)" : "rgba(46, 125, 50, 0.2)"
        }}>
          <span className="status-dot" style={{
            backgroundColor: USE_MOCK_IOT ? "var(--status-warning)" : "var(--status-success)"
          }} />
          {USE_MOCK_IOT ? <IconLeaf size={14} /> : <IconPulse size={14} />}
          <span>{USE_MOCK_IOT ? "Simulated Mock Data" : "Realtime Database Stream"}</span>
        </div>
      </div>

      {loading && (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Connecting to IoT telemetry stream…</p>
        </div>
      )}

      {!loading && !bin && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconBin size={24} /></div>
          <h3>No sensor data reported</h3>
          <p>No telemetry recorded yet at <code>bins/{BIN_ID}</code> from the ESP32 firmware.</p>
        </div>
      )}

      {bin && (
        <div className="card-grid">
          {COMPARTMENTS.map((type) => {
            const c = bin[type] || {};
            const lvlCls = levelClass(c.status);
            const levelVal = c.level != null ? Math.min(100, Math.max(0, Number(c.level))) : 0;

            return (
              <div className={`bin-card ${type}`} key={type}>
                <div className="bin-card-header">
                  <h3 className="bin-card-title">{type} compartment</h3>
                  <span className={`badge ${lvlCls === "level-critical" ? "status-cancelled" : lvlCls === "level-warning" ? "status-pending" : "status-completed"}`}>
                    {statusLabel(c.status)}
                  </span>
                </div>

                <div className="fill-gauge-wrap">
                  <div className="fill-level-display">
                    <span className={`fill-percentage ${lvlCls}`}>
                      {c.level != null ? `${c.level}%` : "—"}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-500)", fontWeight: 600 }}>Fill Level</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${lvlCls}`}
                      style={{ width: `${c.level != null ? levelVal : 0}%` }}
                    />
                  </div>
                </div>

                {c.overweight && (
                  <div className="overweight-alert-box">
                    <IconAlert size={16} />
                    <span>Weight capacity exceeded (Overweight)</span>
                  </div>
                )}

                <dl className="bin-data-list">
                  <dt>Measured Weight</dt>
                  <dd>{c.weight != null ? `${c.weight} kg` : "—"}</dd>
                  {c.moisture != null && (
                    <>
                      <dt>Moisture Reading</dt>
                      <dd>{c.moisture}%</dd>
                    </>
                  )}
                  <dt>Last Reading</dt>
                  <dd>{c.timestamp || "Just now"}</dd>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
