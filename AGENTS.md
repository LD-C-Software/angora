# AI Agent Guidelines for CRM/Support Monorepo

This document provides instructions and constraints for AI agents (like Mistral Vibe) working with this project.

## Project Overview

This is a **self-hosted CRM/Support System** starter monorepo with the following architecture:

- **Backend**: KTor 3.5.1 + Kotlin 2.4.10 + Exposed ORM + PostgreSQL
- **Frontend**: React 18+ + TypeScript + Vite
- **Bots**: Node.js 24+ + TypeScript (Slack, Discord, Email)
- **Containerization**: Docker + Docker Compose

All components run in Docker containers and the entire stack starts with:
```bash
docker-compose up --build
```

## Agent Instructions

### General Rules

1. **Always use Docker**: Never assume host tools (JDK, Node.js, pnpm, Maven) are installed. All development and testing must happen inside containers.

2. **Read before editing**: Never edit a file without reading it first in the current session.

3. **Minimal changes**: Only modify files explicitly requested or necessary to fulfill the task. Don't touch unrelated files.

4. **Verify with Docker**: After any changes, validate with:
   ```bash
   docker-compose build
   docker-compose up --build
   ```

### File Modification Rules

#### Backend (`apps/backend/`)
- **Language**: Kotlin 2.4.10
- **Framework**: KTor 3.5.1
- **ORM**: Exposed 1.3.1
- **Build**: Maven with JDK 25
- **Dependencies**: Use `-jvm` suffix for all KTor artifacts

**Allowed Changes**:
- `src/Application.kt` - KTor routes and business logic
- `pom.xml` - Dependencies and plugins
- `Dockerfile` - Container configuration

**Forbidden Changes**:
- Don't remove health endpoint (`/api/health`)
- Don't change port 8080 without updating docker-compose.yml
- Don't remove Exposed ORM unless explicitly requested

#### Frontend (`apps/frontend/`)
- **Framework**: React 18+ + TypeScript + Vite
- **Build**: pnpm + Node.js 24
- **Serve**: nginx:alpine on port 3000

**Allowed Changes**:
- `src/main.tsx` - React components
- `vite.config.ts` - Vite configuration
- `package.json` - Dependencies
- `Dockerfile` - Container configuration

**Forbidden Changes**:
- Don't change port 3000
- Don't break API proxy to `/api`
- Don't remove nginx.conf

#### Bots (`apps/bots/*/`)
- **Runtime**: Node.js 24+ + TypeScript
- **Build**: pnpm + tsc

**Allowed Changes**:
- `src/index.ts` - Bot logic
- `package.json` - Dependencies
- `Dockerfile` - Container configuration

**Forbidden Changes**:
- Don't change start command (`node dist/index.js`)
- Don't remove TypeScript type: module

#### Infrastructure Files
- **`docker-compose.yml`**: Service orchestration
- **`pnpm-workspace.yaml`**: Workspace configuration
- **`.gitignore`**: Standard ignore patterns
- **`README.md`**: Documentation only

### Environment Variables

The following environment variables are available in the backend container:

```
DB_URL=jdbc:postgresql://postgres:5432/crm
DB_USER=crm
DB_PASSWORD=crm
```

**Important**: When accessing services from within the Docker network, use the service name as hostname:
- `postgres:5432` for PostgreSQL
- `backend:8080` for the KTor backend
- `frontend:3000` for the React app

Do NOT use `localhost` or `127.0.0.1` for inter-service communication.

### Database Access

The backend uses Exposed ORM to connect to PostgreSQL:

```kotlin
import org.jetbrains.exposed.sql.Database

val database = Database.connect(
    url = System.getenv("DB_URL") ?: "jdbc:postgresql://postgres:5432/crm",
    driver = "org.postgresql.Driver",
    user = System.getenv("DB_USER") ?: "crm",
    password = System.getenv("DB_PASSWORD") ?: "crm"
)
```

### API Communication

- Frontend → Backend: Use relative path `/api/...` (proxied via nginx)
- Bot → Backend: Use `http://backend:8080/...` (Docker network DNS)
- External → Backend: Use `http://localhost:8080/...`

### Testing Commands

After making changes, always verify with:

```bash
# Full stack test
docker-compose down
docker-compose up --build

# Check containers
docker ps

# Test backend health
curl http://localhost:8080/api/health

# Test frontend
curl http://localhost:3000

# View logs
docker-compose logs -f backend
```

### Success Criteria

A task is complete when:
1. ✅ All relevant tests pass (Docker build succeeds)
2. ✅ The code runs and produces expected output
3. ✅ User's explicit acceptance criterion is met
4. ✅ No new warnings or errors in logs

## Version Constraints

| Component | Version | Notes |
|-----------|---------|-------|
| Kotlin | 2.4.10 | Required for KTor 3.5.1 |
| KTor | 3.5.1 | Latest stable |
| Exposed | 1.3.1 | Latest stable |
| PostgreSQL JDBC | 42.7.3 | Compatible with Kotlin 2.4 |
| Node.js | 24.x | For frontend and bots |
| React | 18.x | Latest stable |
| TypeScript | 5.x | For frontend and bots |
| Vite | 5.x | For frontend |
| Docker | Latest | Container runtime |

## Common Tasks

### Add a New API Endpoint

1. Edit `apps/backend/src/Application.kt`
2. Add route in the `routing { }` block
3. Use Exposed for database operations
4. Test with `docker-compose up --build backend`

### Add a New Bot

1. Create directory: `apps/bots/new-bot/`
2. Add `src/index.ts` with bot logic
3. Add `package.json` with dependencies
4. Add `Dockerfile` for containerization
5. Add service to `docker-compose.yml`
6. Update `pnpm-workspace.yaml`

### Update Dependencies

1. Edit `apps/backend/pom.xml` for backend
2. Edit `apps/frontend/package.json` for frontend
3. Use `-jvm` suffix for KTor artifacts
4. Verify versions are compatible
5. Test with Docker build

## Troubleshooting

### Maven Build Fails
- Check JDK version in Dockerfile matches Kotlin version
- Verify all dependency versions are compatible
- Check Maven Central for latest versions

### Database Connection Fails
- Verify PostgreSQL is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Ensure `DB_URL` uses `postgres` as hostname (not localhost)

### Frontend Can't Reach Backend
- Verify backend is running: `docker ps`
- Check nginx proxy config in frontend Dockerfile
- Test backend directly: `curl http://localhost:8080/api/health`

## Security Notes

- Never commit secrets to the repository
- Use environment variables for sensitive data
- Database credentials are in docker-compose.yml (for development only)
- For production, use proper secret management

## Style Guidelines

- Match existing code style
- Use Kotlin idiomatic patterns
- TypeScript: Use strict mode
- Docker: Use multi-stage builds where appropriate
- Documentation: Keep it concise and accurate

## Contact

For questions about this project's agent configuration, refer to the README.md or check the project structure.

---

*Last updated: July 17, 2026*
