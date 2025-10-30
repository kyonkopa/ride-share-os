import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { routes } from "./routes/routes"
import { ApolloProvider } from "@apollo/client/react"
import client from "./lib/apollo-client"
import { Toaster } from "sonner"

function App() {
  const router = createBrowserRouter(routes)

  return (
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
      <Toaster position="top-center" offset="10vh" richColors />
    </ApolloProvider>
  )
}

export default App
