# Docker Setup

## Build and Run

### Production
```bash
# Build and start the production container
docker-compose up --build

# Or build and run manually
docker build -t image-gallery-api .
docker run -p 3000:3000 -v ./images:/app/public/images:ro image-gallery-api
```

## Image Volume Mounting

**Important**: Images are NOT copied into the Docker container. They must be mounted as volumes.

### Setup your images directory:
```bash
# Create your images directory (if not exists)
mkdir -p images

# Add your images to this directory
cp /path/to/your/images/* ./images/
```

### Volume Configuration:
- **Production**: `./public/images:/app/public/images`

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Environment Variables

- `NODE_ENV`: Set to `production` or `development`
- `PORT`: Application port (default: 3000)
- `HOSTNAME`: Bind hostname (default: 0.0.0.0)

## Notes

- **Images are excluded** from Docker build for smaller image size
- Use volume mounting for images directory
- Canvas dependencies included for image processing
- Multi-stage build for optimized production image
- Standalone output configuration for efficient Docker deployment
- Non-root user for security 