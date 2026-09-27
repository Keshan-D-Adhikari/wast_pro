import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

const PAGE_SIZE = 25;

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
