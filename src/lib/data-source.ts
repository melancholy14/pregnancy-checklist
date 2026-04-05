// PoC: src/data/ JSON을 직접 import해서 사용
// Phase 4(GCP 전환) 시 GCS 연동 추가 예정

export async function fetchData<T>(path: string): Promise<T> {
  return fetchFromLocal<T>(path);
}

async function fetchFromLocal<T>(path: string): Promise<T> {
  const fs = await import('fs/promises');
  const filePath = `${process.cwd()}/src/data/${path}`;
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}
