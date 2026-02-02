export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    user: null,
    loading: false,
    signOut: async () => {},
  };
}
