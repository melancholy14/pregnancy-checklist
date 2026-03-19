// DATA_SOURCE=local  → src/data/ 에서 읽음  (기본값, 로컬 개발)
// DATA_SOURCE=gcs    → GCS 버킷에서 읽음    (운영)

export async function fetchData<T>(path: string): Promise<T> {
  if (process.env.DATA_SOURCE === 'gcs') {
    return fetchFromGCS<T>(path); // Phase 4에서 구현
  }
  return fetchFromLocal<T>(path);
}

async function fetchFromLocal<T>(path: string): Promise<T> {
  const fs = await import('fs/promises');
  const filePath = `${process.cwd()}/src/data/${path}`;
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchFromGCS<T>(_path: string): Promise<T> {
  // Phase 4에서 구현
  throw new Error('GCS not implemented yet');
}
