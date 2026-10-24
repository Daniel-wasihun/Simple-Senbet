import { NextResponse,NextRequest } from 'next/server'; 
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define admin routes that need protection
    const isAdminRoute = pathname.startsWith('/admin');

    if (isAdminRoute) {
        const userRole = request.cookies.get('user_role')?.value;
        const authToken = request.cookies.get('auth_token')?.value;

        // Direct check: No token or not a Super Admin
        if (!authToken || userRole?.toLowerCase() !== 'super admin') {
            const loginUrl = new URL('/login', request.url); 
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/admin/:path*'],
};  