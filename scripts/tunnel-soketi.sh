#!/bin/bash
# Setup SSH tunnel from production Soketi to localhost for emulator development
# This allows emulator to connect to production Soketi via 10.0.2.2:6001

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔌 Setting up SSH tunnel to production Soketi...${NC}"

# Kill existing tunnel if any
pkill -f "ssh.*6001:localhost:6001" 2>/dev/null || true

# Create SSH tunnel (assumes ssh-mcp server has credentials)
# Forward local 6001 → VPS localhost:6001 (Soketi)
ssh -N -L 6001:localhost:6001 root@clickai.lionsoftware.cloud &

TUNNEL_PID=$!
echo -e "${GREEN}✓ SSH tunnel created (PID: $TUNNEL_PID)${NC}"
echo -e "${GREEN}✓ localhost:6001 → production Soketi${NC}"

# Wait for tunnel to establish
sleep 2

# Test connection
if curl -s -I http://localhost:6001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Tunnel verified - Soketi accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Tunnel may still be establishing...${NC}"
fi

echo ""
echo -e "${YELLOW}Keep this terminal open to maintain the tunnel${NC}"
echo -e "${YELLOW}Press Ctrl+C to close the tunnel${NC}"
echo ""

# Wait for tunnel process
wait $TUNNEL_PID
