import type { StorybookConfig } from "@storybook/experimental-nextjs-vite";
import { join, dirname } from "path";

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  "stories": [
    "../stories/Introduction.mdx",
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../app/jetshare/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/experimental-nextjs-vite",
    "options": {}
  },
  "staticDirs": [
    "../public",
    "../docs"
  ],
  "docs": {
    "autodocs": "tag",
    "defaultName": "Documentation"
  },
  "typescript": {
    "reactDocgen": "react-docgen-typescript",
    "reactDocgenTypescriptOptions": {
      "compilerOptions": {
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true
      },
      "propFilter": {
        "skipPropsWithoutDoc": false
      }
    }
  },
  "viteFinal": async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": join(process.cwd()),
        // Handle lucide-react icon imports with backward compatibility
        "lucide-react/dist/esm/icons": join(process.cwd(), "node_modules/lucide-react/dist/esm/icons"),
        // Replace auth provider with our mock implementation
        "@/components/auth-provider": join(process.cwd(), ".storybook/decorators.jsx")
      };
    }

    // Add custom plugin to handle lucide-react imports
    if (config.plugins) {
      config.plugins.push({
        name: 'lucide-icon-imports-transformer',
        transform(code, id) {
          // Transform specific import patterns only for relevant files
          if (id.includes('.tsx') || id.includes('.jsx') || id.includes('.ts')) {
            // Convert direct imports to namespace imports
            const transformedCode = code.replace(
              /import\s+(\w+)\s+from\s+['"]lucide-react\/dist\/esm\/icons\/(\w+)['"]/g,
              'import { $2 as $1 } from "lucide-react"'
            );
            
            if (transformedCode !== code) {
              return {
                code: transformedCode,
                map: null
              };
            }
          }
          return null;
        }
      });
    }
    
    return config;
  }
};
export default config;