// The image gallery of one file: each image is pending, approved or excluded.
// Pure state, so every rule is testable without Telegram.

export const STATUS = Object.freeze({ PENDING: "pending", APPROVED: "approved", EXCLUDED: "excluded" });

/** Builds a gallery from extracted images and optional AI decisions (same order). */
export function createGallery(images, decisions = []) {
  const items = images.map((img, idx) => {
    const d = decisions[idx] || null;
    const keep = d ? d.keep !== false : true;
    return {
      idx,
      name: img.name,
      mime: img.mime,
      size: img.buffer?.length || 0,
      type: d?.type || "unknown",
      caption: d?.caption || "",
      reason: d?.reason || "",
      status: keep ? STATUS.PENDING : STATUS.EXCLUDED,
      autoExcluded: !keep,
    };
  });
  return { items };
}

export function setStatus(gallery, idx, status) {
  const item = gallery.items[idx];
  if (!item) return false;
  item.status = status;
  return true;
}

export function nextPending(gallery) {
  return gallery.items.find((i) => i.status === STATUS.PENDING) || null;
}

/** Approves every image still pending (excluded ones stay excluded). Returns how many changed. */
export function approveAllPending(gallery) {
  let n = 0;
  for (const i of gallery.items) {
    if (i.status === STATUS.PENDING) {
      i.status = STATUS.APPROVED;
      n += 1;
    }
  }
  return n;
}

export function approvedIndexes(gallery) {
  return gallery.items.filter((i) => i.status === STATUS.APPROVED).map((i) => i.idx);
}

export function counts(gallery) {
  const c = { total: gallery.items.length, pending: 0, approved: 0, excluded: 0, autoExcluded: 0 };
  for (const i of gallery.items) {
    c[i.status] += 1;
    if (i.autoExcluded) c.autoExcluded += 1;
  }
  return c;
}

/** Re-opens every image the AI excluded, so the student can overrule it. */
export function restoreAutoExcluded(gallery) {
  let n = 0;
  for (const i of gallery.items) {
    if (i.autoExcluded && i.status === STATUS.EXCLUDED) {
      i.status = STATUS.PENDING;
      n += 1;
    }
  }
  return n;
}

/** Next pending image after index `after`, wrapping to the first pending one. */
export function nextPendingAfter(gallery, after) {
  const pending = gallery.items.filter((i) => i.status === STATUS.PENDING);
  return pending.find((i) => i.idx > after) || pending[0] || null;
}
