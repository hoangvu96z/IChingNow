/**
 * Copy text to clipboard using Clipboard API
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

/**
 * Download text as .txt file
 * @param {string} text
 * @param {string} filename
 */
export function downloadTxt(text, filename = 'que-kinh-dich.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download JSON
 * @param {Object} data
 * @param {string} filename
 */
export function downloadJson(data, filename = 'que-kinh-dich.json') {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
