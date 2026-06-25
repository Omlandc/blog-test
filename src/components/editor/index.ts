/**
 * Article editor 模块桶导出
 *
 * 支持两种格式：
 * - Markdown（默认）：MarkdownEditor
 * - HTML：HtmlEditor
 */
export { MarkdownEditor } from './MarkdownEditor';
export type { MarkdownEditorProps } from './MarkdownEditor';

export { HtmlEditor } from './HtmlEditor';
export type { HtmlEditorProps } from './HtmlEditor';

export { MarkdownToolbar } from './MarkdownToolbar';
export type { MarkdownToolbarProps, ToolbarAction } from './MarkdownToolbar';

export { ImageUploadButton } from './ImageUploadButton';
export type { ImageUploadButtonProps, UploadedImageInfo } from './ImageUploadButton';

export { ArticleSettingsDialog } from './ArticleSettingsDialog';
export type { ArticleSettingsDialogProps } from './ArticleSettingsDialog';

export {
  useEditorState,
  computeStats,
} from './useEditorState';
export type {
  UseEditorStateOptions,
  UseEditorStateResult,
  EditorMode,
  EditorStats,
} from './useEditorState';
