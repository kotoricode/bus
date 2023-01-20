module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    overrides: [
        {
            files: ["*.svelte"],
            processor: "svelte3/svelte3",
            rules: {
                "no-multiple-empty-lines": "off"
            }
        }
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    },
    plugins: [
        "svelte3",
        "@typescript-eslint"
    ],
    rules: {
        "brace-style": [
            "error",
            "allman"
        ],
        "class-methods-use-this": "error",
        "eol-last": [
            "error",
            "always"
        ],
        "explicit-function-return-type": "off",
        "@typescript-eslint/explicit-function-return-type": [
            "error"
        ],
        indent: "off",
        "@typescript-eslint/indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "max-len": [
            "error",
            {
                code: 100
            }
        ],
        "no-multiple-empty-lines": [
            "error",
            {
                max: 1,
                maxEOF: 0
            }
        ],
        "no-extra-parens": "off",
        "@typescript-eslint/no-extra-parens": [
            "error",
            "all"
        ],
        // "never" is buggy with angle brackets in vscode/ts
        // const a = new Map<string, number>
        "new-parens": [
            "error",
            "always"
        ],
        "no-constant-condition": "off",
        "no-shadow": [
            "error",
            {
                hoist: "all"
            }
        ],
        "no-trailing-spaces": [
            "error"
        ],
        "no-undefined": "error",
        "padding-line-between-statements": "off",
        "@typescript-eslint/padding-line-between-statements": [
            "error",
            {
                blankLine: "always",
                prev: "*",
                next: ["return", "continue", "break"]
            }
        ],
        quotes: [
            "error",
            "double"
        ],
        semi: [
            "error",
            "never"
        ]
    },
    settings: {
        "svelte3/typescript": true,
        "svelte3/ignore-warnings": (warning) => warning.code.includes("a11y")
    }
}
