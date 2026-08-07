import { LoginForm } from '@/components/LoginForm'

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>
}

function getStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <LoginForm
      isUnauthorized={getStringParam(params.error) === 'unauthorized'}
      nextPath={getStringParam(params.next) ?? '/'}
    />
  )
}
