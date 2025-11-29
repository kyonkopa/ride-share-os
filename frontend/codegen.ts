import { CodegenConfig } from "@graphql-codegen/cli"
import "dotenv/config"

const config: CodegenConfig = {
  schema: "../schema.gql",
  documents: "src/**/*.{ts,tsx,gql,graphql}",
  generates: {
    "./src/codegen/": {
      preset: "client",
      plugins: [],
      config: {
        useTypeImports: true,
        enumsAsTypes: false,
        enumsAsConst: true,
      },
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: "getFragmentData" },
      },
    },
  },
}

export default config
