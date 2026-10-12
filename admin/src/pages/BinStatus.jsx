import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { iotDb, BIN_ID, USE_MOCK_IOT, MOCK_BIN_DATA_NORMAL, MOCK_BIN_DATA_ALERT } from "../iotConfig";
import { IconBin, IconAlert, IconPulse, IconLeaf, IconSearch } from "../components/Icons";
import { normalizeBin, normalizeBins, summarizeBin, describeFreshness } from "../lib/binTelemetry";
import { filterBins } from "../lib/filters";

const COMPARTMENTS = ["plastic", "food", "metal"];

// Status word -> CSS class for the colour. FULL/ERROR = red, HALF/75% = orange, else green.
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

// Status word -> text for the badge. Example: "HALF" -> "Half", "75%" -> "75% full".
function statusLabel(status) {
  if (!status) return "No data";
  const upper = status.toUpperCase();
  if (upper === "75%") return "75% full";
  return upper.charAt(0) + upper.slice(1).toLowerCase();
}

// BinDetail: one bin, live. Props: binId (which bin) and onBack (function to go back to the list).
/** One bin: its three compartments, live. */
function BinDetail({ binId, onBack }) {
  const [liveBin, setLiveBin] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [mockPreset, setMockPreset] = useState("normal");

  // In mock mode the bin data is derived from the selected preset during
  // render, rather than copied into state from an effect.
  const bin = USE_MOCK_IOT
    ? (mockPreset === "alert" ? MOCK_BIN_DATA_ALERT : MOCK_BIN_DATA_NORMAL)
    : liveBin;
  const loading = USE_MOCK_IOT ? false : liveLoading;

  // Re-check "live vs offline" periodically so the badge turns Offline by
  // itself if the firmware stops uploading.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  const freshness = USE_MOCK_IOT
    ? { live: true, label: "Demo data" }
    : describeFreshness(bin?.lastUpdated, now);

  // Live listener on bins/<binId>. onValue calls the first function now and again whenever the
  // data changes, so the screen updates by itself. It returns an unsubscribe function, which
  // useEffect uses as cleanup. It restarts if binId changes ([binId] at the end). Not used in demo mode.
  useEffect(() => {
    if (USE_MOCK_IOT) return;

    const binNodeRef = ref(iotDb, `bins/${binId}`);
    return onValue(
      binNodeRef,
      (snapshot) => {
        setLiveBin(snapshot.exists() ? normalizeBin(snapshot.val()) : null);
        setLiveLoading(false);
      },
      () => setLiveLoading(false)
    );
  }, [binId]);

  return (
    <section>
      <div className="page-header">
        <div>
          {/* BUTTON: "← All bins" */}
          <button type="button" className="load-more-btn" style={{ margin: "0 0 0.75rem" }} onClick={onBack}>
            ← All bins
          </button>
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
              {/* BUTTON: "Preset Normal Low / Half" */}
              <button
                type="button"
                className={mockPreset === "normal" ? "btn-sm-success" : "load-more-btn"}
                style={{ margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                onClick={() => setMockPreset("normal")}
              >
                Preset: Normal (Low / Half)
              </button>
              {/* BUTTON: "Preset Alert Full / Overweight" */}
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
            <span>Bin {binId}</span>
          </div>
          <span style={{ fontSize: "0.9rem", color: "var(--ink-500)" }}>
            Hardware Node: <code>bins/{binId}</code>
          </span>
        </div>

        <div className="system-status-pill" style={{
          backgroundColor: USE_MOCK_IOT || !freshness.live ? "var(--status-warning-tint)" : "var(--status-success-tint)",
          color: USE_MOCK_IOT || !freshness.live ? "var(--status-warning)" : "var(--status-success)",
          borderColor: USE_MOCK_IOT || !freshness.live ? "rgba(180, 83, 9, 0.2)" : "rgba(46, 125, 50, 0.2)"
        }}>
          <span className="status-dot" style={{
            backgroundColor: USE_MOCK_IOT || !freshness.live ? "var(--status-warning)" : "var(--status-success)"
          }} />
          {USE_MOCK_IOT ? <IconLeaf size={14} /> : <IconPulse size={14} />}
          <span>{USE_MOCK_IOT ? "Simulated Mock Data" : freshness.live ? "Bin ON · Live" : "Bin OFF · last known reading"}</span>
        </div>
      </div>

      {bin && (
        <p className="subtitle" style={{ margin: "0.25rem 0 1rem" }}>
          {freshness.label}
          {bin.lastUpdated ? ` · ${new Date(bin.lastUpdated).toLocaleString()}` : ""}
          {bin.location ? ` · ${bin.location}` : ""}
        </p>
      )}

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
          <p>No telemetry recorded yet at <code>bins/{binId}</code> from the ESP32 firmware.</p>
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
                  <dd>{bin.lastUpdated ? new Date(bin.lastUpdated).toLocaleTimeString() : c.timestamp || "—"}</dd>
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const PAGE_SIZE = 25;

// BinStatus: list of all bins. Clicking a row opens BinDetail for that bin.
/** Every bin in the IoT database; pick one to see its live readings. */
export default function BinStatus() {
  const [selectedId, setSelectedId] = useState(null);
  const [rawBins, setRawBins] = useState(null);
  const [loading, setLoading] = useState(!USE_MOCK_IOT);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [now, setNow] = useState(() => Date.now());

  // Timer: every 15 seconds update `now` so ON/OFF badges stay correct.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Live listener on the whole "bins" node. It cleans up on leave. Not used in demo mode.
  useEffect(() => {
    if (USE_MOCK_IOT) return;
    return onValue(
      ref(iotDb, "bins"),
      (snapshot) => {
        setRawBins(snapshot.exists() ? snapshot.val() : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  if (selectedId) return <BinDetail binId={selectedId} onBack={() => setSelectedId(null)} />;

  const items = USE_MOCK_IOT
    ? [{ id: BIN_ID, owner: undefined, bin: normalizeBin({ ...MOCK_BIN_DATA_NORMAL, lastUpdated: now, location: "Demo" }) }]
    : normalizeBins(rawBins);
  const summaries = Object.fromEntries(
    items.map((i) => [i.id, USE_MOCK_IOT ? { live: true, maxLevel: 0, attention: false } : summarizeBin(i.bin, now)])
  );
  const filtered = filterBins(items, summaries, { search, status });
  const visible = filtered.slice(0, shown);
  const liveCount = items.filter((i) => summaries[i.id].live).length;
  const attentionCount = items.filter((i) => summaries[i.id].attention).length;

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Smart Bins</h1>
          <p className="subtitle">
            {items.length} bin{items.length === 1 ? "" : "s"} · {liveCount} ON · {items.length - liveCount} OFF
            {attentionCount > 0 ? ` · ${attentionCount} need attention` : ""}. Select a bin to see its live readings.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon"><IconSearch size={16} /></span>
          <input
            type="search"
            placeholder="Search by bin ID, location or owner…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE); }}
          />
        </div>
        <div className="select-filter-wrapper">
          <select className="select-filter" value={status} onChange={(e) => { setStatus(e.target.value); setShown(PAGE_SIZE); }}>
            <option value="all">All bins</option>
            <option value="on">ON (live)</option>
            <option value="off">OFF</option>
            <option value="attention">Needs attention</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="empty-state-box">
          <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
          <p>Connecting to IoT telemetry stream…</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state-box">
          <div className="empty-state-icon"><IconBin size={24} /></div>
          <h3>{items.length === 0 ? "No bins reporting" : "No bins found"}</h3>
          <p>{items.length === 0 ? <>Nothing recorded under <code>bins</code> yet.</> : "No bin matches your search or filter."}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Bin</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Fullest compartment</th>
                  <th>Last update</th>
                  <th style={{ textAlign: "right" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ id, bin }) => {
                  const s = summaries[id];
                  return (
                    <tr key={id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(id)}>
                      <td style={{ fontWeight: 600 }}><code>{id}</code></td>
                      <td>{bin.location || "—"}</td>
                      <td>
                        <span className={`badge ${s.live ? "status-completed" : "status-pending"}`}>{s.live ? "ON" : "OFF"}</span>
                        {s.attention && <span className="badge status-cancelled" style={{ marginLeft: "0.4rem" }}>Needs attention</span>}
                      </td>
                      <td>{s.maxLevel}%</td>
                      <td>{describeFreshness(bin.lastUpdated, now).label}</td>
                      <td style={{ textAlign: "right" }}>
                        {/* BUTTON: "View" */}
                        <button type="button" className="btn-sm-success" onClick={(e) => { e.stopPropagation(); setSelectedId(id); }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filtered.length > shown && (
        // BUTTON: "Show more bins"
        <button type="button" className="load-more-btn" onClick={() => setShown((n) => n + PAGE_SIZE)}>
          Show more bins
        </button>
      )}
    </section>
  );
}
