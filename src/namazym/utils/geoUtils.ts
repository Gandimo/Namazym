export const isPointInTKM = (lat: number, lon: number): boolean => {
    // Turkmenistan Bounding Box (Approximate)
    const TKM_LAT_MIN = 35.1;
    const TKM_LAT_MAX = 42.8;
    const TKM_LON_MIN = 52.4;
    const TKM_LON_MAX = 66.7;

    return lat >= TKM_LAT_MIN && lat <= TKM_LAT_MAX &&
        lon >= TKM_LON_MIN && lon <= TKM_LON_MAX;
};
