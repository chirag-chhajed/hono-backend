import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['node_modules', 'dist', 'dynamodb_data', '.vscode', '.cursor'],
})
