/** Hapus file di disk setelah block di editor dihapus — tunggu autosave selesai dulu */
export function scheduleStoredFileCleanup(storedUrl: string | null | undefined): void {
  if (!storedUrl || !window.electronAPI?.deleteStoredFileIfUnreferenced) return;

  const tryDelete = async (attempt: number) => {
    const delay = attempt === 0 ? 1200 : 800;
    await new Promise((r) => window.setTimeout(r, delay));

    const res = await window.electronAPI.deleteStoredFileIfUnreferenced(storedUrl);
    if (res.ok && !res.deleted && attempt < 3) {
      await tryDelete(attempt + 1);
    }
  };

  void tryDelete(0);
}
