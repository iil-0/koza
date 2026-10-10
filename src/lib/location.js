/**
 * Ask the browser for the user's position and resolve a city name for it.
 * Resolves { lat, lon, city }; rejects with a Turkish, user-facing message.
 */
export function getCurrentPlace() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tarayıcın konum paylaşmayı desteklemiyor.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = Number(coords.latitude.toFixed(3));
        const lon = Number(coords.longitude.toFixed(3));
        resolve({ lat, lon, city: await reverseGeocode(lat, lon) });
      },
      (err) =>
        reject(
          new Error(err.code === err.PERMISSION_DENIED ? 'Konum izni verilmedi.' : 'Konum alınamadı, şehrini yazabilirsin.')
        ),
      { timeout: 10000, maximumAge: 30 * 60 * 1000 }
    );
  });
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=tr`
    );
    if (!res.ok) return '';
    const json = await res.json();
    return json.city || json.locality || json.principalSubdivision || '';
  } catch {
    return '';
  }
}
