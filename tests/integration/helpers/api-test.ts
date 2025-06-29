import { NextRequest } from 'next/server'

interface ApiTestOptions {
  body?: any
  headers?: Record<string, string>
  searchParams?: Record<string, string>
}

interface ApiTestResponse {
  status: number
  body: any
  headers: Headers
}

export async function testApiRoute(
  method: string,
  path: string,
  options: ApiTestOptions = {}
): Promise<ApiTestResponse> {
  // Construct URL with search params
  const url = new URL(`http://localhost:3000${path}`)
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  // Create Next.js request
  const req = new NextRequest(url.toString(), {
    method: method.toUpperCase(),
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Dynamically import the route handler
  const routePath = path.split('?')[0] // Remove query params from path
  let routeModule: any

  // Handle dynamic routes like [imageId]
  let modulePath = routePath
  
  // Replace UUID segments with Next.js dynamic route syntax
  modulePath = modulePath.replace(/\/[a-f0-9-]{36}/g, '/[imageId]')

  try {
    
    // Handle specific route mappings
    if (modulePath === '/api/people') {
      routeModule = await import('@/app/api/people/route')
    } else if (modulePath === '/api/images') {
      routeModule = await import('@/app/api/images/route')
    } else if (modulePath === '/api/images/stats') {
      routeModule = await import('@/app/api/images/stats/route')
    } else if (modulePath === '/api/images/[imageId]') {
      routeModule = await import('@/app/api/images/[imageId]/route')
    } else if (modulePath === '/api/images/[imageId]/rotate') {
      routeModule = await import('@/app/api/images/[imageId]/rotate/route')
    } else if (modulePath === '/api/images/[imageId]/people') {
      routeModule = await import('@/app/api/images/[imageId]/people/route')
    } else if (modulePath === '/api/people/link-to-image') {
      routeModule = await import('@/app/api/people/link-to-image/route')
    } else {
      throw new Error(`Unknown route: ${modulePath}`)
    }
  } catch (error) {
    throw new Error(`Failed to import route handler for ${path}: ${error}`)
  }

  // Get the appropriate handler
  const handler = routeModule[method.toUpperCase()]
  if (!handler) {
    throw new Error(`No ${method.toUpperCase()} handler found for ${path}`)
  }

  // Create context for dynamic routes
  let context: any = {}
  
  // Extract params for dynamic routes like /api/images/[imageId]
  if (modulePath.includes('[imageId]')) {
    const match = routePath.match(/\/api\/images\/([a-f0-9-]{36})/)
    if (match) {
      context = {
        params: Promise.resolve({ imageId: match[1] })
      }
    }
  }

  // Execute the handler with context
  const response = await handler(req, context)

  // Parse response body
  let body: any
  try {
    body = await response.json()
  } catch {
    body = null
  }

  return {
    status: response.status,
    body,
    headers: response.headers,
  }
}

// Helper for testing endpoints that expect UUID parameters
export function mockUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Helper for creating test image data
export function createTestImageData(overrides: Partial<any> = {}) {
  return {
    filename: 'test-image.jpg',
    path: '/images/test-image.jpg',
    size: 1024 * 1024, // 1MB
    width: 800,
    height: 600,
    mimeType: 'image/jpeg',
    isActive: true,
    ...overrides,
  }
}

// Helper for creating test person data
export function createTestPersonData(overrides: Partial<any> = {}) {
  return {
    name: 'Test Person',
    notes: 'This is a test person',
    ...overrides,
  }
}