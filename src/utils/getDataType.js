/**
 * Get value data type
 * @param {*} data
 */
export default function getDataType(val) {
  const type = typeof val;
  if (type !== "object") return type;
  if (Array.isArray(val)) return "array";
  if (val === null) return "null";
  return "object";
}
