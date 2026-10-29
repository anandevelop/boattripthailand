/**
 * Read a NEXT_PUBLIC_* value at run time. `process.env.NEXT_PUBLIC_X` written out is replaced by its value at
 * BUILD time (Next.js inlines it), and the Docker image is built on GitHub without the server's .env — so server
 * code reads these through this helper (the key is a variable, so nothing is inlined) and .env changes apply on restart.
 */
export const pub = (k: `NEXT_PUBLIC_${string}`) => process.env[k as string] || '';
