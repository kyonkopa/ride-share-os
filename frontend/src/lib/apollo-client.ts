import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"
import { ErrorLink } from "@apollo/client/link/error"
import { SetContextLink } from "@apollo/client/link/context"
import { CombinedGraphQLErrors } from "@apollo/client/errors"
import { useAuthStore } from "../stores/AuthStore"

const endpoint =
  import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "http://localhost:3001/graphql"

const httpLink = new HttpLink({
  uri: endpoint,
})

// Auth link to add bearer token to requests
const authLink = new SetContextLink(({ headers }) => {
  // get the authentication token from the auth store
  const { tokens } = useAuthStore.getState()

  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: tokens?.accessToken ? `Bearer ${tokens.accessToken}` : "",
    },
  }
})

const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, path, extensions }) => {
      if (
        extensions?.code === "UNAUTHENTICATED" &&
        !path?.includes("currentUser")
      ) {
        // Clear auth storage and redirect to login
        useAuthStore.getState().clearStorage()
        // You might want to add navigation logic here
        window.location.href = "/login"
      }

      console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`)
    })
  } else {
    console.error(`[Network error]: ${error}`)
  }
})

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(errorLink).concat(httpLink),
  devtools: {
    enabled: import.meta.env.DEV,
  },
})

export default client
