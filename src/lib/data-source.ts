// PoC: src/data/ JSON을 직접 import해서 사용
// Phase 4(GCP 전환) 시 GCS 연동 추가 예정

import fs from 'fs/promises';
import path from 'path';

export async function fetchData<T>(dataPath: string): Promise<T> {
  return fetchFromLocal<T>(dataPath);
}

async function fetchFromLocal<T>(dataPath: string): Promise<T> {
  const baseDir = path.join(process.cwd(), 'src/data');
  const filePath = path.join(baseDir, dataPath);
  if (!filePath.startsWith(baseDir)) {
    throw new Error('Invalid data path');
  }
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}
