import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseKey =
            process.env.SUPABASE_SECRET_KEY ||
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

          if (supabaseUrl && supabaseKey) {
            const { createClient } = await import('@supabase/supabase-js')
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { data: user } = await supabase
              .from('users')
              .select('*')
              .eq('email', credentials.email)
              .single()

            if (user) {
              const bcrypt = await import('bcryptjs')
              const valid = await bcrypt.compare(
                credentials.password as string,
                user.password_hash
              )
              if (valid) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.nickname,
                  image: user.avatar_url,
                }
              }
            }
          }

          if (process.env.NODE_ENV === 'development') {
            if (
              credentials.email === 'test@test.com' &&
              credentials.password === 'test1234'
            ) {
              return {
                id: 'test-user-id',
                email: 'test@test.com',
                name: '테스트유저',
              }
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),

    // Google - only if credentials exist
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          (await import('next-auth/providers/google')).default({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Kakao - only if credentials exist
    ...(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET
      ? [
          (await import('next-auth/providers/kakao')).default({
            clientId: process.env.KAKAO_CLIENT_ID,
            clientSecret: process.env.KAKAO_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
