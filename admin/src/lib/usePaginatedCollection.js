// A custom React hook for the list pages. It listens live to a Firestore collection but only
// loads the first N documents. "Load more" raises N. This keeps reads (and cost) small.
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

// How many documents to add each time the admin presses Load more.
const PAGE_SIZE = 25;

// In: the collection name, e.g. "users". Out: { docs, loading, hasMore, loadMore }.
// docs = array of { id, ...fields }; hasMore = true when the cap was reached (there may be more).
/**
 * Live-subscribes to a collection capped at a growing `limit(...)`, instead
 * of streaming every document unbounded. `loadMore` raises the cap so more
 * documents come into the same live listener.
 */
export function usePaginatedCollection(collectionName) {
  // cap = current limit, docs = loaded documents, loading = true until the first answer.
  const [cap, setCap] = useState(PAGE_SIZE);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  // totalMatchedCap is true when we got exactly `cap` documents, which suggests more exist.
  const [totalMatchedCap, setTotalMatchedCap] = useState(false);

  // onSnapshot opens a live listener: the callback runs now and again on every change in the
  // database, so the table updates by itself. It returns an unsubscribe function; returning it from
  // useEffect is the cleanup that closes the old listener. The effect re-runs when the collection
  // name or the cap changes, so raising the cap starts a new, larger listener.
  useEffect(() => {
    return onSnapshot(
      query(collection(db, collectionName), limit(cap)),
      (snapshot) => {
        setDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTotalMatchedCap(snapshot.docs.length === cap);
        setLoading(false);
      },
      // Error callback: stop showing the loading state even if reading failed (e.g. rules deny it).
      () => setLoading(false)
    );
  }, [collectionName, cap]);

  return {
    docs,
    loading,
    hasMore: totalMatchedCap,
    loadMore: () => setCap((c) => c + PAGE_SIZE),
  };
}
