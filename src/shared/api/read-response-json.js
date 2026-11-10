// Error responses may have an empty or non-JSON body. Cancellation and
// transport failures must still reach the caller instead of becoming null.
export async function readResponseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}
