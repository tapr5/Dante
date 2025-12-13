import axios from "axios";

// ================== CONFIG ==================
const FIREBASE_BASE =
  "https://firestore.googleapis.com/v1/projects/animewitcher-1c66d/databases/(default)/documents";

const ALGOLIA_BASE = "https://5uiu27g8cz-dsn.algolia.net/1/indexes";
const ALGOLIA_APP_ID = "5UIU27G8CZ";
const ALGOLIA_API_KEY = "ef06c5ee4a0d213c011694f18861805c";

// ================== HANDLER ==================
export default async function handler(req, res) {
  try {
    const { type } = req.query;
    if (!type) {
      return res.status(400).json({ error: "type مطلوب" });
    }

    // ================== SEARCH ==================
    if (type === "search") {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: "q مطلوب" });

      const r = await axios.post(
        `${ALGOLIA_BASE}/series/query`,
        {
          params: `attributesToRetrieve=["objectID","name","poster_uri","type","rating"]&query=${encodeURIComponent(
            q
          )}&hitsPerPage=10`
        },
        {
          headers: {
            "X-Algolia-Application-Id": ALGOLIA_APP_ID,
            "X-Algolia-API-Key": ALGOLIA_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      return res.json(r.data.hits || []);
    }

    // ================== EPISODES ==================
    if (type === "episodes") {
      const { anime } = req.query;
      if (!anime) {
        return res.status(400).json({ error: "anime مطلوب" });
      }

      const r = await axios.get(
        `${FIREBASE_BASE}/anime_list/${encodeURIComponent(
          anime
        )}/episodes_summery/summery`
      );

      const episodes =
        r.data?.fields?.episodes?.arrayValue?.values?.map(v => {
          const f = v.mapValue.fields;
          return {
            id: f.doc_id?.stringValue || "",
            name: f.name?.stringValue || "",
            filler: f.filler?.booleanValue || false
          };
        }) || [];

      return res.json({
        anime,
        count: episodes.length,
        episodes
      });
    }

    // ================== SERVERS ==================
    if (type === "servers") {
      const { anime, episode } = req.query;
      if (!anime || !episode) {
        return res
          .status(400)
          .json({ error: "anime و episode مطلوبان" });
      }

      const r = await axios.get(
        `${FIREBASE_BASE}/anime_list/${encodeURIComponent(
          anime
        )}/episodes/${episode}/servers2/all_servers`
      );

      const servers =
        r.data?.fields?.servers?.arrayValue?.values?.map(v => {
          const f = v.mapValue.fields;
          return {
            name: f.name?.stringValue || "Unknown",
            quality: f.quality?.stringValue || "SD",
            link: f.link?.stringValue || "",
            direct: f.direct_link?.booleanValue || false,
            open_browser: f.open_browser?.booleanValue || false,
            visible: f.visible?.booleanValue !== false
          };
        }) || [];

      return res.json({
        anime,
        episode,
        count: servers.length,
        servers
      });
    }

    // ================== UNKNOWN ==================
    return res.status(400).json({ error: "type غير مدعوم" });
  } catch (e) {
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: e.message
    });
  }
}
