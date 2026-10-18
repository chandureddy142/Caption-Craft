// https://vite.dev/config/
export default {
  server: {
    allowedHosts: true,
  },
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