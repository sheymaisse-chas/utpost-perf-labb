// En GraphQL-fråga till Utposts API. useAsyncData kör frågan PÅ SERVERN vid första besöket och
// skickar med svaret i HTML:en, så att browsern inte frågar en gång till när Vue tar över sidan
// (hydration). Klickar man sig vidare i browsern körs samma fråga därifrån i stället.
export const useUtpost = <T>(key: string, query: string, variables: Record<string, unknown> = {}) =>
  useAsyncData<T>(key, async () => {
    const res = await $fetch<{ data: T }>('/graphql', { method: 'POST', body: { query, variables } })
    return res.data
  })
