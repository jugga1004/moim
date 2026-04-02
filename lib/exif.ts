import exifr from 'exifr';

export interface ExifData {
  takenAt: string | null;
  lat: number | null;
  lng: number | null;
  make: string | null;
  model: string | null;
  raw: string | null;
}

export async function extractExif(buffer: Buffer): Promise<ExifData> {
  try {
    const data = await exifr.parse(buffer, {
      tiff: true,
      gps: true,
      exif: true,
      translateValues: true,
    });

    if (!data) {
      return { takenAt: null, lat: null, lng: null, make: null, model: null, raw: null };
    }

    let takenAt: string | null = null;
    const dateVal = data.DateTimeOriginal ?? data.CreateDate ?? data.DateTime;
    if (dateVal instanceof Date) {
      takenAt = dateVal.toISOString();
    } else if (typeof dateVal === 'string') {
      takenAt = dateVal;
    }

    return {
      takenAt,
      lat: typeof data.latitude === 'number' ? data.latitude : null,
      lng: typeof data.longitude === 'number' ? data.longitude : null,
      make: data.Make ?? null,
      model: data.Model ?? null,
      raw: JSON.stringify(data),
    };
  } catch {
    return { takenAt: null, lat: null, lng: null, make: null, model: null, raw: null };
  }
}
