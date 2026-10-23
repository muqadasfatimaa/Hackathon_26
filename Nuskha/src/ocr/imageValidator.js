/**
 * Nuskha AI - Stage 2 Prescription Scanner
 * Image File & Format Validator
 */

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp"
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MIN_FILE_SIZE_BYTES = 100; // at least 100 bytes

/**
 * Validates an uploaded File or Blob
 *
 * @param {File|Blob|Object} file - File or Blob object to validate
 * @returns {Object} Validation outcome
 */
function validateImageFile(file) {
  if (!file) {
    return {
      valid: false,
      error: "No file was provided. Please select an image of a prescription or medicine packaging.",
      code: "FILE_MISSING"
    };
  }

  const name = file.name || "image";
  const size = file.size || 0;
  const type = (file.type || "").toLowerCase();

  // Extension check
  const ext = name.split(".").pop().toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.has(ext);
  const hasValidMime = type ? ALLOWED_MIME_TYPES.has(type) : false;

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: `Unsupported file format "${ext || type || 'unknown'}". Allowed formats: JPG, JPEG, PNG, WEBP.`,
      code: "INVALID_FORMAT",
      fileMeta: { name, size, type, ext }
    };
  }

  // Size check
  if (size <= MIN_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "The selected file is empty or corrupted (size is under 100 bytes). Please upload a valid image.",
      code: "FILE_TOO_SMALL",
      fileMeta: { name, size, type, ext }
    };
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum limit of 10 MB. Please upload a smaller image.`,
      code: "FILE_TOO_LARGE",
      fileMeta: { name, size, type, ext }
    };
  }

  return {
    valid: true,
    fileMeta: {
      name,
      size,
      sizeFormatted: formatBytes(size),
      type: type || `image/${ext}`,
      ext
    }
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    validateImageFile,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    formatBytes
  };
}

if (typeof window !== "undefined") {
  window.NuskhaImageValidator = {
    validateImageFile,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    formatBytes
  };
}
