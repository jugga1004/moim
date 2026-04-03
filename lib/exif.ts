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
      // toISOString()은 UTC 변환으로 시간이 틀어지므로 로컬 시각을 직접 포맷
      const pad = (n: number) => String(n).padStart(2, '0');
      takenAt = `${dateVal.getFullYear()}-${pad(dateVal.getMonth() + 1)}-${pad(dateVal.getDate())}T${pad(dateVal.getHours())}:${pad(dateVal.getMinutes())}:${pad(dateVal.getSeconds())}`;
    } else if (typeof dateVal === 'string') {
      // EXIF 문자열 "2025:12:13 15:30:00" → ISO 형식으로 변환
      takenAt = dateVal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
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
