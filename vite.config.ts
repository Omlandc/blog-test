import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { blogSyncPlugin } from './vite-plugins/blog-sync';
import { siteMetaPlugin } from './vite-plugins/site-meta';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), blogSyncPlugin(), siteMetaPlugin()],
  base: '/blog-test/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 手动分块：把第三方库拆成独立 chunk，提升缓存命中率
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-markdown': [
            'marked',
            'react-markdown',
            'remark-gfm',
            'rehype-raw',
            'rehype-highlight',
            'rehype-sanitize',
            'dompurify',
            'highlight.js',
          ],
        },
      },
    },
  },
});
