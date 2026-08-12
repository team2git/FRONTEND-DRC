import { useEffect, useState } from "react";
import api from "@/api/axios";

let cachedPortalContent: any | null = null;
let inFlight: Promise<any> | null = null;

const PORTAL_CONTENT_EVENT = "portalContentUpdated";

export const usePortalContent = () => {
  const [portalContent, setPortalContent] = useState<any>(cachedPortalContent);
  const [loading, setLoading] = useState(!cachedPortalContent);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(!cachedPortalContent);
        if (!inFlight) {
          inFlight = api
            .get("/site-settings")
            .then((res) => res.data)
            .finally(() => {
              inFlight = null;
            });
        }
        const data = await inFlight;
        cachedPortalContent = data;
        if (mounted) setPortalContent(data);
      } catch {
        if (mounted) setPortalContent(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const handleUpdate = () => {
      load();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(PORTAL_CONTENT_EVENT, handleUpdate);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(PORTAL_CONTENT_EVENT, handleUpdate);
      }
    };
  }, []);

  return { portalContent, loading };
};

export const invalidatePortalContentCache = () => {
  cachedPortalContent = null;
  inFlight = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PORTAL_CONTENT_EVENT));
  }
};
