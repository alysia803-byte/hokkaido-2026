// 北海道版地圖：Leaflet + OpenStreetMap 底圖，外部導航用 Google Maps（日本 Google Maps 路線最齊）。
(function () {
  const TILE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const maps = new WeakMap();

  function clean(text) { return String(text || "").replace(/[,/]/g, " ").trim(); }
  function placeName(place) { return place.nameZh || place.name || place.id; }
  function gmapName(place) { return clean(place.googleMapsQuery || place.name || place.nameZh); }

  function gmapsPlaceUrl(place) {
    const query = gmapName(place);
    if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    if (place?.geo) return `https://www.google.com/maps/search/?api=1&query=${place.geo.lat}%2C${place.geo.lng}`;
    return gmapsSearchUrl(place?.name || "");
  }
  function gmapsSearchUrl(query) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(query || "").trim())}`; }
  function gmapsRouteUrl(places) {
    const pts = places.filter((p) => p?.geo);
    if (pts.length < 2) return pts[0] ? gmapsPlaceUrl(pts[0]) : "https://www.google.com/maps/";
    const at = (p) => `${p.geo.lat},${p.geo.lng}`;
    const origin = at(pts[0]);
    const destination = at(pts[pts.length - 1]);
    const waypoints = pts.slice(1, -1).map(at).join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}&travelmode=transit`;
  }

  function pinIcon(label, active) {
    return L.divIcon({ className: "seoul-pin-wrap", html: `<span class="seoul-pin${active ? " is-active" : ""}">${label}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
  }

  // container: element; places: [{place, label?}]; opts: {route: bool, activeId}
  function render(container, places, opts = {}) {
    if (typeof L === "undefined") { container.innerHTML = '<p class="gmap-caption">地圖載入唔到（要上網），請用下面 Google Maps 按鈕。</p>'; return null; }
    let map = maps.get(container);
    if (map) { map.remove(); }
    container.innerHTML = "";
    map = L.map(container, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    maps.set(container, map);
    L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19 }).addTo(map);
    const pts = places.filter((item) => item.place?.geo);
    const latlngs = pts.map((item) => [item.place.geo.lat, item.place.geo.lng]);
    if (opts.route && latlngs.length > 1) {
      L.polyline(latlngs, { color: "#ffffff", weight: 7, opacity: 0.9 }).addTo(map);
      L.polyline(latlngs, { color: "#d6453d", weight: 4, opacity: 0.95, dashArray: "8 7" }).addTo(map);
    }
    pts.forEach((item, index) => {
      const active = item.place.id === opts.activeId;
      const marker = L.marker([item.place.geo.lat, item.place.geo.lng], { icon: pinIcon(opts.route ? String(index + 1) : "●", active), zIndexOffset: active ? 1000 : 0 }).addTo(map);
      marker.bindTooltip(placeName(item.place), { permanent: true, direction: "right", offset: [12, 0], className: `seoul-label${active ? " is-active" : ""}` });
      marker.bindPopup(`<strong>${placeName(item.place)}</strong><br><a href="${gmapsPlaceUrl(item.place)}" target="_blank" rel="noopener noreferrer">用 Google Maps 打開 ↗</a>`);
      if (opts.onPick) marker.on("click", () => opts.onPick(item.place.id));
    });
    const fit = () => {
      if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 16 });
      else if (latlngs.length === 1) map.setView(latlngs[0], 16);
      else map.setView([43.0687, 141.3508], 11);
    };
    fit();
    setTimeout(() => { map.invalidateSize(); fit(); }, 80);
    return map;
  }

  // 保留原接口名稱（app.js / route-ui.js 用 window.SeoulMap 調用），內部全部指向 Google Maps。
  window.SeoulMap = { render, kakaoPlaceUrl: gmapsPlaceUrl, kakaoRouteUrl: gmapsRouteUrl, kakaoSearchUrl: gmapsSearchUrl };
})();
