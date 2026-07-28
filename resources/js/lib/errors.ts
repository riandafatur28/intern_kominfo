export function extractErrorMessage(e: unknown, fallback: string): string {
  const response = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response;
  const errors = response?.data?.errors;
  if (errors) {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && errors[firstKey]?.[0]) return errors[firstKey][0];
  }
  return response?.data?.message || fallback;
}
