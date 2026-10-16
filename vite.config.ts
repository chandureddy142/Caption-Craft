// https://vite.dev/config/
export default {
  esbuild: {
    rollupOptions: {
      onwarn(warning: any, warn: any) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
    },
    jsx: 'automatic',
  },
}
