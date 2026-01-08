# NodePress Demo System - Docker Setup

Containerized demo environment for NodePress CMS.

## Quick Start

```bash
# Copy environment file
cp .env.example .env

# Edit with your settings
nano .env

# Start the demo system
docker-compose up -d

# View logs
docker-compose logs -f
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx                                │
│               (Reverse Proxy + SSL Termination)             │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐     ┌─────────────┐   ┌─────────────┐
   │ Demo 1  │     │   Demo 2    │   │   Demo N    │
   │ :4001   │     │   :4002     │   │   :400N     │
   └────┬────┘     └──────┬──────┘   └──────┬──────┘
        │                 │                 │
        └────────────┬────┴─────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────┐              ┌─────▼─────┐
   │ Postgres│              │   Redis   │
   │  (5433) │              │  (6380)   │
   └─────────┘              └───────────┘
```

## Services

- **postgres** - Main database for demo tracking
- **redis** - Session management and caching
- **orchestrator** - Manages demo lifecycle
- **nginx** - Routes requests to correct demo instance
- **cleanup** - Removes expired demos

## API Endpoints

```
POST   /api/demos          - Create new demo
GET    /api/demos          - List all demos (admin)
GET    /api/demos/:id      - Get demo details
POST   /api/demos/:id/extend - Extend demo
DELETE /api/demos/:id      - Terminate demo
GET    /api/analytics      - Demo analytics (admin)
```

## Scaling

Adjust `MAX_CONCURRENT_DEMOS` in `.env` based on resources:

| RAM    | CPUs | Max Demos |
|--------|------|-----------|
| 4GB    | 2    | 10        |
| 8GB    | 4    | 25        |
| 16GB   | 8    | 50        |
| 32GB   | 16   | 100       |

## Troubleshooting

```bash
# Check demo container logs
docker logs nodepress-demo-<subdomain>

# Access demo database
docker exec -it nodepress-demo-postgres psql -U nodepress -d demo_<subdomain>

# Manually cleanup expired demos
docker exec nodepress-demo-cleanup /app/cleanup.sh

# Restart all services
docker-compose restart
```

## Security Notes

1. Change default passwords in `.env`
2. Configure SSL certificates for production
3. Set up firewall rules to restrict Postgres/Redis access
4. Monitor demo resource usage
5. Enable rate limiting on Nginx

