import { useEffect, useState } from "react";
import api from "@/api/axios";

let cachedPortalContent: any | null = null;
let inFlight: Promise<any> | null = null;

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
    return () => {
      mounted = false;
    };
  }, []);

  return { portalContent, loading };
};

export const invalidatePortalContentCache = () => {
  cachedPortalContent = null;
  inFlight = null;
};
