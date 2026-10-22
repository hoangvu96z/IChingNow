/** Attempt remote deletions without treating a failed response as a success. */
export async function deleteReadingItems(items, { isAuthenticated, deleteRemote }) {
  const results = await Promise.all((items || []).map(async (item) => {
    if (!isAuthenticated || !item?._remoteId) return { item, deleted: true };

    try {
      const response = await deleteRemote(item._remoteId);
      if (response?.ok === false) {
        throw new Error(`HTTP ${response.status || 'error'}`);
      }
      return { item, deleted: true };
    } catch (error) {
      return { item, deleted: false, error };
    }
  }));

  return {
    deletedItems: results.filter(result => result.deleted).map(result => result.item),
    failedItems: results.filter(result => !result.deleted),
  };
}
