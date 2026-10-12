import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

const PAGE_SIZE = 25;

// In: the collection name, e.g. "users". Out: { docs, loading, hasMore, loadMore }.
// docs = array of { id, ...fields }; hasMore = true when the cap was reached (there may be more).
/**
 * Live-subscribes to a collection capped at a growing `limit(...)`, instead
 * of streaming every document unbounded. `loadMore` raises the cap so more
 * documents come into the same live listener.
 */
export function usePaginatedCollection(collectionName) {
  const [cap, setCap] = useState(PAGE_SIZE);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalMatchedCap, setTotalMatchedCap] = useState(false);

  // onSnapshot opens a live listener: the callback runs now and again on every change in the
  // database, so the table updates by itself. It returns an unsubscribe function; returning it from
  // useEffect is the cleanup that closes the old listener. The effect re-runs when the collection
  useEffect(() => {
    return onSnapshot(
      query(collection(db, collectionName), limit(cap)),
      (snapshot) => {
        setDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTotalMatchedCap(snapshot.docs.length === cap);
        setLoading(false);
      },
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
