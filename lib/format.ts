export function formatDistance(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

export function formatElevation(elevationMeters: number | null): string {
  if (elevationMeters === null) {
    return "Unavailable";
  }

  return `${Math.round(elevationMeters)} m`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function formatPace(secondsPerKilometer: number): string {
  if (!Number.isFinite(secondsPerKilometer) || secondsPerKilometer <= 0) {
    return "-- /km";
  }

  const totalSeconds = Math.round(secondsPerKilometer);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}
