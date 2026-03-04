// Minimal ambient declaration for suncalc.
// Prevents TS errors when @types/suncalc is not installed.
// Replaced by proper types once `npm install --save-dev @types/suncalc` is run.
declare module 'suncalc' {
    interface SunPosition {
        altitude: number;  // radians above the horizon
        azimuth: number;   // radians from south, clockwise
    }
    function getPosition(date: Date, lat: number, lng: number): SunPosition;
    function getTimes(date: Date, lat: number, lng: number): Record<string, Date>;
}
