#!/usr/bin/env bash
# generate-certs.sh
# Generates a self-signed CA and a server TLS certificate signed by that CA.
# Run from the project root: bash generate-certs.sh
#
# Output files (all in certs/):
#   ca.key        - CA private key  (KEEP SECRET - do not commit)
#   ca.crt        - CA certificate  (import into browser/OS trust store)
#   server.key    - Server private key (KEEP SECRET - do not commit)
#   server.csr    - Server certificate signing request
#   server.crt    - Server certificate signed by the CA

set -e

# Disable MSYS/Git Bash path conversion so openssl -subj "/CN=..." is not
# rewritten to "C:/Program Files/Git/CN=...". No-op on macOS/Linux.
export MSYS_NO_PATHCONV=1

CERTS_DIR="certs"

# Remove any previous cert files so we always start fresh (avoids stale
# serial/key files causing unexpected password prompts on re-runs)
rm -f "$CERTS_DIR"/ca.key "$CERTS_DIR"/ca.crt "$CERTS_DIR"/ca.srl \
      "$CERTS_DIR"/server.key "$CERTS_DIR"/server.csr "$CERTS_DIR"/server.crt \
      "$CERTS_DIR"/server.ext
mkdir -p "$CERTS_DIR"

echo "=== Step 1: Generate CA private key (4096-bit RSA, no passphrase) ==="
openssl genrsa -passout pass:"" -out "$CERTS_DIR/ca.key" 4096

echo ""
echo "=== Step 2: Generate self-signed CA certificate (valid 10 years) ==="
openssl req -new -x509 -days 3650 \
  -key "$CERTS_DIR/ca.key" \
  -passin pass:"" \
  -out "$CERTS_DIR/ca.crt" \
  -subj "/CN=T12-G05-CA/O=INFO2222/C=AU"

echo ""
echo "=== Step 3: Generate server private key (2048-bit RSA, no passphrase) ==="
openssl genrsa -passout pass:"" -out "$CERTS_DIR/server.key" 2048

echo ""
echo "=== Step 4: Generate server Certificate Signing Request (CSR) ==="
openssl req -new \
  -key "$CERTS_DIR/server.key" \
  -passin pass:"" \
  -out "$CERTS_DIR/server.csr" \
  -subj "/CN=localhost/O=INFO2222/C=AU"

echo ""
echo "=== Step 5: Sign the server CSR with the CA certificate ==="
# The Subject Alternative Name (SAN) extension is required by modern browsers.
# Without SAN for localhost/127.0.0.1 the browser will reject the certificate
# even if the CN matches.
#
# Use a real file (not <(printf ...) process substitution) so that
# MinGW/Git Bash openssl can read it. /dev/fd/N pseudo-paths do not exist on
# Windows and openssl fails with "Can't open /dev/fd/63". We use a relative
# path inside certs/ (not /tmp/) because Windows openssl cannot resolve the
# MSYS /tmp virtual filesystem when MSYS_NO_PATHCONV=1 is set.
EXT_FILE="$CERTS_DIR/server.ext"
trap 'rm -f "$EXT_FILE"' EXIT
printf "subjectAltName=DNS:localhost,IP:127.0.0.1\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth" > "$EXT_FILE"

openssl x509 -req -days 365 \
  -in "$CERTS_DIR/server.csr" \
  -CA "$CERTS_DIR/ca.crt" \
  -CAkey "$CERTS_DIR/ca.key" \
  -passin pass:"" \
  -CAcreateserial \
  -out "$CERTS_DIR/server.crt" \
  -extfile "$EXT_FILE"

echo ""
echo "=== Certificate generation complete ==="
echo ""
echo "Files created:"
ls -lh "$CERTS_DIR/"
echo ""
echo "Next steps:"
echo "  1. Trust the CA:   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERTS_DIR/ca.crt"
echo "  2. Start server:   cd merged && npm run dev"
echo ""
echo "WARNING: Private keys (*.key) are gitignored. Do NOT commit them."
