import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { routes } from "./routes/routes"
import { ApolloProvider } from "@apollo/client/react"
import client from "./lib/apollo-client"
import { Toaster } from "sonner"
import ErrorBoundary from "./components/ErrorBoundary"

function App() {
  const router = createBrowserRouter(routes)

  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <RouterProvider router={router} />
        <Toaster position="top-center" offset="10vh" richColors />
      </ApolloProvider>
    </ErrorBoundary>
  )
}

export default App
